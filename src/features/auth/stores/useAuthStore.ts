import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { User, Profile } from '../../../types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isRecoveryMode: boolean;
  
  // Capability permissions flags mapping user profile status properties
  isHustlerVerified: boolean;
  isAgentVerified: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setRecoveryMode: (isRecovery: boolean) => void;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  initialize: () => Promise<void>; // Corrected name matching hook consumption fields exactly
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

// Private module-level flag to block redundant structural broadcast listener mounts entirely
let isListenerAttached = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  error: null,
  isInitialized: false,
  isRecoveryMode: false,
  isHustlerVerified: false,
  isAgentVerified: false,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setRecoveryMode: (isRecoveryMode) => set({ isRecoveryMode }),
  
  setProfile: (profile) => {
    if (!profile) {
      set({ 
        profile: null, 
        isHustlerVerified: false, 
        isAgentVerified: false 
      });
      return;
    }

    const isHustler = profile.is_hustler === true || (profile as any).hustler_approved === true;
    const isAgent = profile.is_agent === true || (profile as any).agent_approved === true;

    set({ 
      profile, 
      isHustlerVerified: isHustler, 
      isAgentVerified: isAgent 
    });
  },

  updateProfile: async (updatedFields) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const merged = { ...currentProfile, ...updatedFields };
    get().setProfile(merged);
  },

  fetchProfile: async (userId) => {
    if (userId.includes('guest') || userId === 'usr_lagos_9081') {
      const mockProfile: Profile = {
        id: userId,
        username: 'hustle_partner',
        full_name: 'Lagos Professional Demo',
        avatar_url: null,
        bio: 'Verified professional service provider context.',
        location: 'Lagos, Nigeria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hustler: true, 
        is_agent: false
      } as any;
      
      get().setProfile(mockProfile);
      return mockProfile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        get().setProfile(data);
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('[Auth Store Engine] Profile lookup failed:', err);
      set({ error: err.message });
      return null;
    }
  },

  initialize: async () => {
    // If we've already set up auth session and attached the stream, exit early to block loop cascading
    if (get().isInitialized && isListenerAttached) {
      return;
    }

    set({ isLoading: true });
    
    // Check baseline session status natively on start
    const { data: { session } } = await supabase.auth.getSession();
    set({ session });
    
    if (session?.user) {
      set({ user: session.user as unknown as User });
      await get().fetchProfile(session.user.id);
    } else {
      // Setup zero-friction local guest baseline profile seamlessly
      const mockUser: User = {
        id: 'guest-wqtg1i7',
        email: 'guest@hustle.xyz',
        created_at: new Date().toISOString()
      } as any;
      
      set({ user: mockUser });
      await get().fetchProfile(mockUser.id);
    }
    
    set({ isLoading: false, isInitialized: true });

    // Ensure the continuous multi-cast notification event engine channel registers only once
    if (!isListenerAttached) {
      isListenerAttached = true;
      
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession: Session | null) => {
        set({ session: currentSession });
        
        if (event === 'PASSWORD_RECOVERY') {
          set({ isRecoveryMode: true });
        }

        if (currentSession?.user) {
          const nativeUser = currentSession.user as unknown as User;
          
          // Check block to prevent duplicating updates if target matching elements haven't altered state values
          if (get().user?.id === nativeUser.id && get().profile) return;
          
          set({ user: nativeUser });
          await get().fetchProfile(nativeUser.id);
        } else {
          if (get().user?.id?.startsWith('guest-')) return;
          set({ user: null, profile: null, isHustlerVerified: false, isAgentVerified: false, isRecoveryMode: false });
        }
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    const currentId = get().user?.id;
    
    if (currentId && currentId.startsWith('guest-')) {
      set({ user: null, profile: null, session: null, isHustlerVerified: false, isAgentVerified: false, isRecoveryMode: false, isLoading: false });
      return;
    }
    
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, isHustlerVerified: false, isAgentVerified: false, isRecoveryMode: false, isLoading: false });
  }
}));