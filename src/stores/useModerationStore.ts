import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import type { 
  Report, 
  ReportTargetType, 
  ModerationQueueItem, 
  CreatorVerification, 
  ModerationLog,
  ReportStatus,
  ModerationPriority,
  ModerationStatus,
  VerificationStatus,
  VerificationType,
  PlatformStats
} from '../types/moderation';

interface ModerationState {
  reports: Report[];
  moderationQueue: ModerationQueueItem[];
  moderationLogs: ModerationLog[];
  verificationRequests: CreatorVerification[];
  moderators: any[];
  allUsers: any[];
  disputes: any[];
  escrows: any[];
  stats: PlatformStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStats: () => Promise<void>;
  fetchQueue: () => Promise<void>;
  fetchVerifications: () => Promise<void>;
  fetchModerators: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  fetchDisputes: () => Promise<void>;
  fetchEscrows: () => Promise<void>;
  submitReport: (params: { 
    target_id: string; 
    target_type: ReportTargetType; 
    reason: string; 
    details?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  
  reviewReport: (reportId: string, status: ReportStatus) => Promise<void>;
  
  moderateContent: (params: {
    target_id: string;
    target_type: ReportTargetType;
    action: ModerationStatus;
    reason: string;
    queueItemId?: string;
    reportId?: string;
  }) => Promise<void>;
  
  verifyCreator: (verificationId: string, status: VerificationStatus) => Promise<void>;
  submitVerificationRequest: (type: VerificationType, metadata: any) => Promise<void>;
  fetchLogs: () => Promise<void>;
  subscribeToAdminEvents: () => () => void;
}

const ensureAdminAccess = () => {
  const profile = useAuthStore.getState().profile;
  const isAuthorized = ['moderator', 'admin', 'super_admin'].includes(profile?.role || '');
  if (!isAuthorized) {
    throw new Error('Access Denied: Row level security / Unauthorized platform access.');
  }
};

export const useModerationStore = create<ModerationState>((set, get) => ({
  reports: [],
  moderationQueue: [],
  verificationRequests: [],
  moderationLogs: [],
  moderators: [],
  allUsers: [],
  disputes: [],
  escrows: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    try {
      ensureAdminAccess();
      const { data, error } = await (supabase as any).rpc('get_platform_stats');
      if (error) throw error;
      set({ stats: data, error: null });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      set({ error: err.message });
    }
  },

  fetchModerators: async () => {
    try {
      ensureAdminAccess();
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .in('role', ['moderator', 'admin', 'super_admin']);
      if (error) throw error;
      set({ moderators: data, error: null });
    } catch (err: any) {
      console.error('Failed to fetch moderators:', err);
      set({ error: err.message });
    }
  },

  fetchAllUsers: async () => {
    try {
      ensureAdminAccess();
      const { data: profiles, error: pError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (pError) throw pError;

      const { data: states, error: sError } = await (supabase as any)
        .from('content_moderation_states')
        .select('*')
        .eq('target_type', 'profile');

      const statesMap = new Map();
      if (states) {
        states.forEach((s: any) => {
          statesMap.set(s.target_id, s);
        });
      }

      const usersWithSuspension = (profiles || []).map((p: any) => ({
        ...p,
        is_suspended: ['hidden', 'removed'].includes(statesMap.get(p.id)?.moderation_status || '')
      }));

      set({ allUsers: usersWithSuspension, error: null });
    } catch (err: any) {
      console.error('Failed to fetch all users with suspension:', err);
      set({ error: err.message });
    }
  },

  fetchDisputes: async () => {
    try {
      ensureAdminAccess();
      // 1. Fetch reports of type 'booking'
      const { data: reports, error: reportErr } = await (supabase as any)
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(full_name, username)
        `)
        .eq('target_type', 'booking')
        .order('created_at', { ascending: false });
      
      if (reportErr) throw reportErr;

      if (!reports || reports.length === 0) {
        set({ disputes: [], error: null });
        return;
      }

      // 2. Fetch associated bookings manually since Postgrest join without FK is restricted
      const bookingIds = reports.map((r: any) => r.target_id);
      const { data: bookings, error: bookingErr } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          buyer:profiles!bookings_buyer_id_fkey(full_name, username),
          seller:profiles!bookings_seller_id_fkey(full_name, username)
        `)
        .in('id', bookingIds);

      if (bookingErr) throw bookingErr;

      // 3. Merge
      const joinedDisputes = reports.map((report: any) => ({
        ...report,
        booking: bookings?.find((b: any) => b.id === report.target_id)
      }));

      set({ disputes: joinedDisputes, error: null });
    } catch (err: any) {
      console.error('Failed to fetch disputes:', err);
      set({ error: err.message });
    }
  },

  fetchEscrows: async () => {
    try {
      ensureAdminAccess();
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          buyer:profiles!bookings_buyer_id_fkey(full_name, username),
          seller:profiles!bookings_seller_id_fkey(full_name, username)
        `)
        .in('escrow_status', ['held', 'locked'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ escrows: data, error: null });
    } catch (err: any) {
      console.error('Failed to fetch escrows:', err);
      set({ error: err.message });
    }
  },

  fetchQueue: async () => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      // 1. Fetch moderation_queue items that are not closed
      const { data: queueItems, error: queueErr } = await (supabase as any)
        .from('moderation_queue')
        .select('*')
        .not('status', 'eq', 'closed')
        .order('severity_score', { ascending: false });
      
      if (queueErr) throw queueErr;

      if (!queueItems || queueItems.length === 0) {
        set({ moderationQueue: [], error: null });
        return;
      }

      // 2. Fetch associated reports with reporter profiles
      const reportIds = queueItems.map((item: any) => item.report_id).filter(Boolean);
      let reportsMap: Record<string, any> = {};
      
      if (reportIds.length > 0) {
        const { data: reports, error: reportErr } = await (supabase as any)
          .from('reports')
          .select(`
            *,
            reporter:profiles!reports_reporter_id_fkey(full_name, username)
          `)
          .in('id', reportIds);
        
        if (reportErr) throw reportErr;
        
        if (reports) {
          reports.forEach((r: any) => {
            reportsMap[r.id] = r;
          });
        }
      }

      // 3. Collect post IDs to fetch details for reported posts
      const postIds = queueItems
        .filter((item: any) => item.target_type === 'post')
        .map((item: any) => item.target_id);

      let postsMap: Record<string, any> = {};
      if (postIds.length > 0) {
        const { data: posts, error: postsErr } = await (supabase as any)
          .from('posts')
          .select(`
            *,
            user:profiles(full_name, username)
          `)
          .in('id', postIds);
        
        if (postsErr) throw postsErr;
        
        if (posts) {
          posts.forEach((p: any) => {
            postsMap[p.id] = p;
          });
        }
      }

      // 4. Merge everything
      const fullyRealizedQueue = queueItems.map((item: any) => {
        const report = reportsMap[item.report_id || ''] || null;
        const post = item.target_type === 'post' ? postsMap[item.target_id] : null;
        
        return {
          ...item,
          report,
          post,
          reported_user: post?.user || null
        };
      });

      set({ moderationQueue: fullyRealizedQueue as any[], error: null });
    } catch (err: any) {
      console.error('Failed to fetch moderation queue:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchVerifications: async () => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      const { data, error } = await (supabase as any)
        .from('creator_verifications')
        .select('*, profiles(full_name, username)')
        .eq('status', 'pending');
      
      if (error) throw error;
      set({ verificationRequests: data as any[], error: null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  submitReport: async ({ target_id, target_type, reason, details }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required to report');

      const { error } = await (supabase as any)
        .from('reports')
        .insert([{
          reporter_id: user.id,
          target_id,
          target_type,
          reason,
          details,
          status: 'pending'
        }]);

      if (error) {
        if (error.code === '23505') return { success: false, error: 'You have already reported this content.' };
        throw error;
      }

      return { success: true };
    } catch (err: any) {
      console.error('Report submission failed:', err);
      return { success: false, error: err.message };
    }
  },

  reviewReport: async (reportId, status) => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('reports')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', reportId);

      if (error) throw error;
      
      // Update local state
      set(state => ({
        moderationQueue: state.moderationQueue.filter(item => item.report_id !== reportId),
        error: null
      }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  moderateContent: async ({ target_id, target_type, action, reason, queueItemId, reportId }) => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Update content states
      const { error: stateError } = await (supabase as any)
        .from('content_moderation_states')
        .upsert({
          target_id,
          target_type,
          moderation_status: action,
          updated_at: new Date().toISOString()
        });

      if (stateError) throw stateError;

      // 2. Log action to moderation_logs
      await (supabase as any).from('moderation_logs').insert([{
        moderator_id: user?.id,
        action_type: `content_${action}`,
        target_id,
        target_type,
        reason
      }]);

      // 3. If there is a queueItemId, close the queue item
      if (queueItemId) {
        await (supabase as any)
          .from('moderation_queue')
          .update({ status: 'closed' })
          .eq('id', queueItemId);
      }

      // 4. Update reports status to resolved/dismissed
      const finalReportStatus = action === 'approved' ? 'dismissed' : 'resolved';
      if (reportId) {
        await (supabase as any)
          .from('reports')
          .update({ 
            status: finalReportStatus, 
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id 
          })
          .eq('id', reportId);
      } else {
        await (supabase as any)
          .from('reports')
          .update({ 
            status: finalReportStatus, 
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id 
          })
          .eq('target_id', target_id)
          .eq('target_type', target_type)
          .eq('status', 'pending');
      }

      // 5. Trigger rapid local refresh of items
      get().fetchStats();
      get().fetchQueue();
      get().fetchAllUsers();
      get().fetchLogs();
    } catch (err: any) {
      console.error('Failed to moderate content:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyCreator: async (verificationId, status) => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('creator_verifications')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', verificationId);

      if (error) throw error;
      
      set(state => ({
        verificationRequests: state.verificationRequests.filter(item => item.id !== verificationId),
        error: null
      }));

      // Refresh platform metrics & audit trail instantly on the frontend
      get().fetchStats();
      get().fetchLogs();
      get().fetchAllUsers();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  submitVerificationRequest: async (type, metadata) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('creator_verifications')
        .insert([{
          user_id: user.id,
          verification_type: type,
          status: 'pending',
          submission_metadata: metadata
        }]);

      if (error) throw error;
    } catch (err: any) {
        set({ error: err.message });
    }
  },

  fetchLogs: async () => {
    set({ isLoading: true });
    try {
      ensureAdminAccess();
      const { data, error } = await (supabase as any)
        .from('moderation_logs')
        .select('*, moderator:profiles(full_name, username)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ moderationLogs: data as any[], error: null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToAdminEvents: () => {
    try {
      ensureAdminAccess();
    } catch (err: any) {
      console.warn("Realtime subscription bypassed for non-admin");
      return () => {};
    }
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', table: 'reports', schema: 'public' }, () => {
        get().fetchStats();
        get().fetchQueue();
        get().fetchDisputes();
      })
      .on('postgres_changes', { event: '*', table: 'bookings', schema: 'public' }, () => {
        get().fetchStats();
        get().fetchEscrows();
        get().fetchDisputes();
      })
      .on('postgres_changes', { event: '*', table: 'moderation_queue', schema: 'public' }, () => {
        get().fetchStats();
        get().fetchQueue();
      })
      .on('postgres_changes', { event: '*', table: 'creator_verifications', schema: 'public' }, () => {
        get().fetchStats();
        get().fetchVerifications();
      })
      .on('postgres_changes', { event: '*', table: 'moderation_logs', schema: 'public' }, () => {
        get().fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
