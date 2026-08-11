import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { 
  HustlerAgent, 
  AgentPermission, 
  AgentCommission, 
  AgentApplication, 
  AgentAnalytics 
} from '../types';

interface AgentState {
  managedHustlers: Array<HustlerAgent & { permissions?: AgentPermission | null }>;
  commissionHistory: AgentCommission[];
  pendingInvites: HustlerAgent[];
  activePermissions: Record<string, AgentPermission>; // Key: hustler_id
  myApplication: AgentApplication | null;
  analytics: AgentAnalytics;
  isLoading: boolean;
  error: string | null;

  // Application Flow (Step 1)
  submitAgentApplication: (agencyName: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  fetchMyAgentApplication: () => Promise<AgentApplication | null>;

  // Relationship Controls (Step 2 & 11)
  requestAgentAccess: (hustlerId: string, commissionPercentage: number) => Promise<{ success: boolean; relationship?: HustlerAgent; error?: string }>;
  respondToInvite: (relationshipId: string, status: 'active' | 'revoked') => Promise<{ success: boolean; error?: string }>;
  approveAgent: (relationshipId: string) => Promise<{ success: boolean; error?: string }>;
  revokeAgent: (relationshipId: string) => Promise<{ success: boolean; error?: string }>;

  // Permission Controls (Step 7)
  updateAgentPermissions: (relationshipId: string, permissions: Partial<AgentPermission>) => Promise<{ success: boolean; error?: string }>;
  fetchAgentPermissions: (relationshipId: string) => Promise<AgentPermission | null>;

  // Data Loading Methods (Step 5, 6, 12)
  fetchManagedHustlers: () => Promise<void>;
  fetchPendingInvites: () => Promise<void>;
  fetchCommissionHistory: () => Promise<void>;
  fetchAgentAnalytics: () => Promise<AgentAnalytics | null>;
  resetStore: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  managedHustlers: [],
  commissionHistory: [],
  pendingInvites: [],
  activePermissions: {},
  myApplication: null,
  analytics: {
    totalRevenue: 0,
    pendingCommissions: 0,
    hustlerCounts: { total: 0, active: 0, pending: 0 },
    monthlyRevenueSeries: [],
    performanceStats: [],
    growthRate: 0,
    averageCommission: 0
  },
  isLoading: false,
  error: null,

  resetStore: () => {
    set({
      managedHustlers: [],
      commissionHistory: [],
      pendingInvites: [],
      activePermissions: {},
      myApplication: null,
      analytics: {
        totalRevenue: 0,
        pendingCommissions: 0,
        hustlerCounts: { total: 0, active: 0, pending: 0 },
        monthlyRevenueSeries: [],
        performanceStats: [],
        growthRate: 0,
        averageCommission: 0
      },
      isLoading: false,
      error: null
    });
  },

  submitAgentApplication: async (agencyName: string, bio?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to submit an application.');

      const { data, error } = await (supabase as any)
        .from('agent_applications')
        .insert({
          user_id: user.id,
          agency_name: agencyName,
          status: 'pending',
          submission_metadata: { bio }
        })
        .select()
        .single();

      if (error) throw error;

      set({ myApplication: data as AgentApplication });
      return { success: true };
    } catch (err: any) {
      console.error('[AgentStore] Error submitting application:', err);
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyAgentApplication: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('agent_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      set({ myApplication: data as AgentApplication });
      return data as AgentApplication;
    } catch (err: any) {
      console.error('[AgentStore] Error fetching my application:', err);
      return null;
    }
  },

  requestAgentAccess: async (hustlerId, commissionPercentage) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('hustler_agents')
        .insert({
          agent_id: user.id,
          hustler_id: hustlerId,
          commission_percentage: commissionPercentage,
          status: 'pending'
        })
        .select(`
          *,
          hustler_profile:profiles!hustler_id(*)
        `)
        .single();

      if (error) throw error;

      const relationship = data as HustlerAgent;
      set(state => ({
        pendingInvites: [...state.pendingInvites, relationship]
      }));

      return { success: true, relationship };
    } catch (err: any) {
      console.error('[AgentStore] Error requesting access:', err);
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  respondToInvite: async (relationshipId, status) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('hustler_agents')
        .update({ status })
        .eq('id', relationshipId)
        .or(`hustler_id.eq.${user.id},agent_id.eq.${user.id}`);

      if (error) throw error;

      await get().fetchPendingInvites();
      await get().fetchManagedHustlers();
      get().fetchAgentAnalytics().catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error('[AgentStore] Error responding to invite:', err);
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  approveAgent: async (relationshipId) => {
    return get().respondToInvite(relationshipId, 'active');
  },

  revokeAgent: async (relationshipId) => {
    return get().respondToInvite(relationshipId, 'revoked');
  },

  updateAgentPermissions: async (relationshipId, permissions) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await (supabase as any)
        .from('agent_permissions')
        .update(permissions)
        .eq('relationship_id', relationshipId);

      if (error) throw error;

      // Refresh managed list to get latest permission fields inline
      await get().fetchManagedHustlers();

      return { success: true };
    } catch (err: any) {
      console.error('[AgentStore] Error updating permissions:', err);
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAgentPermissions: async (relationshipId) => {
    try {
      const { data, error } = await (supabase as any)
        .from('agent_permissions')
        .select('*')
        .eq('relationship_id', relationshipId)
        .maybeSingle();

      if (error) throw error;
      return data as AgentPermission;
    } catch (err: any) {
      console.error('[AgentStore] Fetch permissions error:', err);
      return null;
    }
  },

  fetchManagedHustlers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch active managed list and join profiles & permissions
      const { data, error } = await (supabase as any)
        .from('hustler_agents')
        .select(`
          *,
          hustler_profile:profiles!hustler_id(*),
          agent_profile:profiles!agent_id(*),
          permissions:agent_permissions(*)
        `)
        .eq('agent_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Extract details
      const formatted: Array<HustlerAgent & { permissions?: AgentPermission | null }> = (data || []).map((item: any) => ({
        id: item.id,
        hustler_id: item.hustler_id,
        agent_id: item.agent_id,
        status: item.status,
        commission_percentage: Number(item.commission_percentage),
        created_at: item.created_at,
        hustler_profile: item.hustler_profile,
        agent_profile: item.agent_profile,
        permissions: item.permissions ? item.permissions[0] || item.permissions : null
      }));

      // Cache active permissions by hustler_id for easy inline view checks
      const permMap: Record<string, AgentPermission> = {};
      formatted.forEach(item => {
        if (item.permissions) {
          permMap[item.hustler_id] = item.permissions;
        }
      });

      set({ managedHustlers: formatted, activePermissions: permMap });
    } catch (err: any) {
      console.error('[AgentStore] Error fetching managed hustlers:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingInvites: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Checks both sent proposals (for agent) and received proposals (for specialist)
      // Joined profiles on both ends so we have perfect lookup
      const { data, error } = await (supabase as any)
        .from('hustler_agents')
        .select(`
          *,
          hustler_profile:profiles!hustler_id(*),
          agent_profile:profiles!agent_id(*)
        `)
        .eq('status', 'pending')
        .or(`agent_id.eq.${user.id},hustler_id.eq.${user.id}`);

      if (error) throw error;

      set({ pendingInvites: (data || []) as HustlerAgent[] });
    } catch (err: any) {
      console.error('[AgentStore] Error fetching pending invites:', err);
    }
  },

  fetchCommissionHistory: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('agent_commissions')
        .select(`
          *,
          booking:bookings(id, total_price, status, buyer_id),
          hustler_profile:profiles!hustler_id(*)
        `)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ commissionHistory: (data || []) as AgentCommission[] });
    } catch (err: any) {
      console.error('[AgentStore] Error fetching commission history:', err);
    }
  },

  fetchAgentAnalytics: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch total payout/earning transactions for this agent to compute real-time revenue
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('amount, status, metadata')
        .eq('user_id', user.id)
        .eq('type', 'earning' as any)
        .eq('status', 'completed');

      if (txError) throw txError;

      // Sum actual completed total revenue
      const totalRevenue = (txs || [])
        .filter((tx: any) => tx.metadata?.booking_id !== undefined)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      // 2. Fetch pending commissions inside pipeline tracker
      const { data: pendingCommissionRows, error: pendingError } = await (supabase as any)
        .from('agent_commissions')
        .select('commission_amount')
        .eq('agent_id', user.id)
        .eq('status', 'pending');

      const pendingCommissions = (pendingCommissionRows || []).reduce(
        (sum: number, item: any) => sum + Number(item.commission_amount || 0),
        0
      );

      // 3. Fetch count of managed hustlers
      const { data: hustlers, error: hError } = await (supabase as any)
        .from('hustler_agents')
        .select('status, hustler_id');

      if (hError) throw hError;

      const hustlerCounts = {
        total: hustlers?.length || 0,
        active: hustlers?.filter((h: any) => h.status === 'active').length || 0,
        pending: hustlers?.filter((h: any) => h.status === 'pending').length || 0
      };

      // 4. Fetch revenue by month group for visual charts
      const { data: commissions, error: comError } = await (supabase as any)
        .from('agent_commissions')
        .select('commission_amount, created_at, hustler_profile:profiles!hustler_id(full_name), booking_id')
        .eq('agent_id', user.id)
        .eq('status', 'paid');

      if (comError) throw comError;

      // Map monthly stats group
      const monthMap: Record<string, number> = {};
      const performanceMap: Record<string, { name: string; count: number; earnings: number; generated: number }> = {};

      commissions?.forEach((item: any) => {
        // Render month index (e.g. "Aug 2026")
        const date = new Date(item.created_at);
        const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap[monthStr] = (monthMap[monthStr] || 0) + Number(item.commission_amount || 0);

        // Track specialist metrics (bookings pipeline)
        const nameStr = item.hustler_profile?.full_name || 'Specialist ' + item.hustler_id.slice(0, 5);
        if (!performanceMap[item.hustler_id]) {
          performanceMap[item.hustler_id] = {
            name: nameStr,
            count: 0,
            earnings: 0,
            generated: 0
          };
        }
        performanceMap[item.hustler_id].count += 1;
        performanceMap[item.hustler_id].generated += Number(item.commission_amount || 0);
      });

      const monthlyRevenueSeries = Object.entries(monthMap).map(([month, amount]) => ({
        month,
        amount
      }));

      const performanceStats = Object.entries(performanceMap).map(([hustlerId, stats]) => ({
        hustlerId,
        hustlerName: stats.name,
        bookingsCount: stats.count,
        totalEarnings: stats.generated * 5, // Back-calculate estimation
        commissionGenerated: stats.generated
      }));

      // Compute growth rate compared to previous month
      let growthRate = 0;
      if (monthlyRevenueSeries.length >= 2) {
        const sortedSeries = [...monthlyRevenueSeries].sort((a, b) => 
          new Date(a.month).getTime() - new Date(b.month).getTime()
        );
        const currentMonth = sortedSeries[sortedSeries.length - 1].amount;
        const previousMonth = sortedSeries[sortedSeries.length - 2].amount;
        if (previousMonth > 0) {
          growthRate = Number(((currentMonth - previousMonth) / previousMonth * 100).toFixed(1));
        } else if (currentMonth > 0) {
          growthRate = 100;
        }
      }

      const analytics: AgentAnalytics = {
        totalRevenue,
        pendingCommissions,
        hustlerCounts,
        monthlyRevenueSeries,
        performanceStats,
        growthRate,
        averageCommission: hustlers?.length 
          ? Math.round(hustlers.reduce((acc, h) => acc + Number(h.commission_percentage || 0), 0) / hustlers.length)
          : 0
      };

      set({ analytics });
      return analytics;
    } catch (err: any) {
      console.error('[AgentStore] Error fetching analytics:', err);
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
}));
