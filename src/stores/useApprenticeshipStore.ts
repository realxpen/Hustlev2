import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { 
  Apprenticeship, 
  ApprenticeshipApplication, 
  ApprenticeshipProgress, 
  Certification 
} from '../types/apprenticeship';

interface ApprenticeshipState {
  myPrograms: Apprenticeship[];
  myApprenticeships: Apprenticeship[];
  availablePrograms: Apprenticeship[];
  applications: ApprenticeshipApplication[];
  progress: ApprenticeshipProgress[];
  certifications: Certification[];
  isLoading: boolean;
  error: string | null;

  // Mentor Actions
  createProgram: (params: Partial<Apprenticeship>) => Promise<boolean>;
  getProgramApplications: (programId: string) => Promise<void>;
  respondToApplication: (applicationId: string, status: 'accepted' | 'rejected') => Promise<boolean>;
  addMilestone: (programId: string, milestone: Partial<ApprenticeshipProgress>) => Promise<boolean>;
  completeProgram: (programId: string) => Promise<boolean>;

  // Learner Actions
  fetchAvailablePrograms: () => Promise<void>;
  applyToProgram: (programId: string, message: string) => Promise<boolean>;
  fetchMyApprenticeships: (userId: string) => Promise<void>;
  updateMilestone: (milestoneId: string, completed: boolean) => Promise<boolean>;
  fetchCertifications: (userId: string) => Promise<void>;
}

export const useApprenticeshipStore = create<ApprenticeshipState>((set, get) => ({
  myPrograms: [],
  myApprenticeships: [],
  availablePrograms: [],
  applications: [],
  progress: [],
  certifications: [],
  isLoading: false,
  error: null,

  createProgram: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await (supabase as any)
        .from('apprenticeships')
        .insert({
          ...params,
          mentor_id: user.id,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  getProgramApplications: async (programId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('apprenticeship_applications')
        .select('*, applicant_profile:profiles(*)')
        .eq('apprenticeship_id', programId);

      if (error) throw error;
      set({ applications: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  respondToApplication: async (applicationId, status) => {
    try {
      const { error } = await (supabase as any)
        .from('apprenticeship_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error responding to application:', err);
      return false;
    }
  },

  fetchAvailablePrograms: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('apprenticeships')
        .select('*, mentor_profile:profiles(*)')
        .eq('status', 'pending')
        .is('learner_id', null);

      if (error) throw error;
      set({ availablePrograms: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  applyToProgram: async (programId, message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await (supabase as any)
        .from('apprenticeship_applications')
        .insert({
          apprenticeship_id: programId,
          applicant_id: user.id,
          message,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error applying to program:', err);
      return false;
    }
  },

  fetchMyApprenticeships: async (userId) => {
    set({ isLoading: true });
    try {
      // Both as learner and mentor
      const [programs, apprenticeships] = await Promise.all([
        (supabase as any).from('apprenticeships').select('*, learner_profile:profiles(*)').eq('mentor_id', userId),
        (supabase as any).from('apprenticeships').select('*, mentor_profile:profiles(*)').eq('learner_id', userId)
      ]);

      set({ 
        myPrograms: (programs.data as any) || [], 
        myApprenticeships: (apprenticeships.data as any) || [] 
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addMilestone: async (programId, milestone) => {
    try {
      const { data } = await (supabase as any)
        .from('apprenticeships')
        .select('learner_id')
        .eq('id', programId)
        .single();
      
      if (!data?.learner_id) throw new Error('Program has no learner assigned');

      const { error } = await (supabase as any)
        .from('apprenticeship_progress')
        .insert({
          ...milestone,
          apprenticeship_id: programId,
          learner_id: data.learner_id
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error adding milestone:', err);
      return false;
    }
  },

  updateMilestone: async (milestoneId, completed) => {
    try {
      const { error } = await (supabase as any)
        .from('apprenticeship_progress')
        .update({ 
          completion_status: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', milestoneId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      return false;
    }
  },

  completeProgram: async (programId) => {
    try {
      const { error } = await (supabase as any)
        .from('apprenticeships')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', programId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error completing program:', err);
      return false;
    }
  },

  fetchCertifications: async (userId) => {
    try {
      const { data, error } = await (supabase as any)
        .from('certifications')
        .select('*, apprenticeship:apprenticeships(title, mentor_profile:profiles(full_name))')
        .eq('learner_id', userId);

      if (error) throw error;
      set({ certifications: (data as any) || [] });
    } catch (err: any) {
      console.error('Error fetching certifications:', err);
    }
  }
}));
