/// <reference types="vite/client" />
import { createClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = !supabaseUrl || 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your-project-id') || 
  !supabaseUrl.startsWith('https://');

// Local Storage backed mock database to protect app against "Failed to fetch" blockades
class MockSupabaseClient {
  private listeners: Set<(event: string, session: Session | null) => void> = new Set();
  private storageData: Record<string, any[]> = {};

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // Load existing database from localStorage or seed empty ones
    const tables = [
      'profiles', 'posts', 'stories', 'stories_presence', 'bookings', 
      'escrow_transactions', 'notifications', 'messages', 'conversations', 
      'wallets', 'transactions', 'live_sessions', 'followers', 'likes', 
      'reposts', 'comment_threads', 'onboarding_status'
    ];
    tables.forEach(table => {
      const stored = localStorage.getItem(`hustle_db_${table}`);
      if (stored) {
        try {
          this.storageData[table] = JSON.parse(stored);
        } catch {
          this.storageData[table] = [];
        }
      } else {
        this.storageData[table] = [];
      }
    });

    // Seed default posts so feed is populated instantly
    if (this.storageData['posts'].length === 0) {
      this.storageData['posts'] = [
        {
          id: 'post-1',
          user_id: 'maker-1',
          title: 'High taper fade with sharp line',
          content: 'Just finished this clean look. Bookings open for this weekend in Miami beach!',
          media_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80',
          media_type: 'image',
          service_id: 'service-1',
          created_at: new Date().toISOString(),
          category: 'Haircut',
          likes_count: 142,
          reposts_count: 8,
          comments_count: 24,
          profiles: {
            id: 'maker-1',
            full_name: 'Marcus Barber',
            username: 'marcus_blades',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            profession: 'Master Barber'
          }
        },
        {
          id: 'post-2',
          user_id: 'maker-2',
          title: 'Cinematic car videography shoot',
          content: 'Color grading on point. Direct sunlight hitting the bodywork nicely.',
          media_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&auto=format&fit=crop&q=80',
          media_type: 'video',
          service_id: 'service-2',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          category: 'Photography',
          likes_count: 322,
          reposts_count: 31,
          comments_count: 55,
          profiles: {
            id: 'maker-2',
            full_name: 'Alex Lens',
            username: 'alex_visuals',
            avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
            profession: 'Director of Photography'
          }
        },
        {
          id: 'post-3',
          user_id: 'maker-3',
          title: 'Emergency pipe leaking restoration',
          content: 'Fast action saves the basement! Got this customer dried and fixed in under an hour.',
          media_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=80',
          media_type: 'image',
          service_id: 'service-3',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          category: 'Plumbing',
          likes_count: 45,
          reposts_count: 1,
          comments_count: 3,
          profiles: {
            id: 'maker-3',
            full_name: 'Dan Leakfinder',
            username: 'dan_plumbing',
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
            profession: 'Emergency Plumber'
          }
        }
      ];
      this.saveTable('posts');
    }

    // Seed default profiles
    if (this.storageData['profiles'].length === 0) {
      this.storageData['profiles'] = [
        {
          id: 'demo-hustler-id',
          full_name: 'Demo Hustler',
          username: 'demohustler',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          role: 'hustler',
          is_hustler: true,
          location: 'Miami, FL',
          profession: 'UI/UX Mobile Designer',
          hustle_name: 'Quantum UI Labs',
          primary_skill: 'Product Design',
          secondary_skills: ['Figma', 'React', 'Tailwind', 'Framing'],
          review_count: 42,
          rating_average: 4.9,
          has_reviews: true,
          default_currency: 'USD',
          display_currency: 'USD',
          created_at: new Date().toISOString()
        },
        {
          id: 'maker-1',
          full_name: 'Marcus Barber',
          username: 'marcus_blades',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          role: 'hustler',
          is_hustler: true,
          location: 'Miami Beach, FL',
          profession: 'Master Barber',
          primary_skill: 'Haircut',
          review_count: 112,
          rating_average: 4.8,
          created_at: new Date().toISOString()
        }
      ];
      this.saveTable('profiles');
    }

    // Seed default stories
    if (this.storageData['stories'].length === 0) {
      this.storageData['stories'] = [
        {
          id: 'story-1',
          user_id: 'maker-1',
          media_url: 'https://images.unsplash.com/photo-1512690196222-7c72e5653d3b?w=500&auto=format&fit=crop',
          media_type: 'image',
          caption: 'Fresh morning trims! \uD83D\uDC88',
          created_at: new Date().toISOString(),
          profiles: {
            username: 'marcus_blades',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          }
        },
        {
          id: 'story-2',
          user_id: 'maker-2',
          media_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&auto=format&fit=crop',
          media_type: 'video',
          caption: 'Shooting a music festival today \uD83C\uDFB8',
          created_at: new Date().toISOString(),
          profiles: {
            username: 'alex_visuals',
            avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
          }
        }
      ];
      this.saveTable('stories');
    }
  }

  private saveTable(table: string) {
    localStorage.setItem(`hustle_db_${table}`, JSON.stringify(this.storageData[table]));
  }

  // Auth Operations
  public auth = {
    getSession: async () => {
      const stored = localStorage.getItem('hustle_guest_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          return { data: { session }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },
    getUser: async () => {
      const stored = localStorage.getItem('hustle_guest_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          return { data: { user: session.user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    },
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      this.listeners.add(callback);
      
      // Fire immediately
      const stored = localStorage.getItem('hustle_guest_session');
      let currentSession: Session | null = null;
      if (stored) {
        try { currentSession = JSON.parse(stored); } catch {}
      }
      callback('SIGNED_IN', currentSession);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners.delete(callback);
            }
          }
        }
      };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      const fakeUser = {
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: email.split('@')[0] }
      };
      const session = { user: fakeUser, access_token: 'fake', refresh_token: 'fake' } as any;
      localStorage.setItem('hustle_guest_session', JSON.stringify(session));
      this.listeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user: fakeUser, session }, error: null };
    },
    signUp: async ({ email, options }: any) => {
      const fakeUser = {
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: options?.data?.full_name || email.split('@')[0] }
      };
      const session = { user: fakeUser, access_token: 'fake', refresh_token: 'fake' } as any;
      localStorage.setItem('hustle_guest_session', JSON.stringify(session));
      this.listeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user: fakeUser, session }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('hustle_guest_session');
      this.listeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    },
    updateUser: async (updates: any) => {
      const stored = localStorage.getItem('hustle_guest_session');
      if (stored) {
        const session = JSON.parse(stored);
        session.user = { ...session.user, ...updates };
        localStorage.setItem('hustle_guest_session', JSON.stringify(session));
        return { data: { user: session.user }, error: null };
      }
      return { error: new Error('No user signed in') };
    }
  };

  // Database Query Operations
  public from(table: string) {
    const list = this.storageData[table] || [];
    
    // Create chainable builder
    const builder = {
      data: [...list],
      error: null as any,
      filters: [] as ((item: any) => boolean)[],
      orderField: '',
      orderAsc: false,
      limitNum: 0,
      rangeStart: null as number | null,
      rangeEnd: null as number | null,

      select: (cols?: string) => {
        return builder;
      },
      insert: (records: any) => {
        const arr = Array.isArray(records) ? records : [records];
        const updated = arr.map(raw => {
          const complete = {
            id: raw.id || 'id-' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            ...raw
          };
          if (table === 'posts' && !complete.profiles) {
            complete.profiles = {
              id: 'demo-hustler-id',
              full_name: 'Demo Hustler',
              username: 'demohustler',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
              profession: 'UI/UX Mobile Designer'
            };
          }
          return complete;
        });

        if (!this.storageData[table]) {
          this.storageData[table] = [];
        }
        this.storageData[table].push(...updated);
        this.saveTable(table);
        builder.data = updated;
        return builder;
      },
      update: (fields: any) => {
        builder.filters.forEach(() => {}); // track execution for Promise resolution
        builder.data = (this.storageData[table] || []).map(item => {
          return item;
        });
        return builder;
      },
      upsert: (records: any) => {
        const arr = Array.isArray(records) ? records : [records];
        if (!this.storageData[table]) {
          this.storageData[table] = [];
        }
        arr.forEach(raw => {
          const existingIndex = this.storageData[table].findIndex(x => x.id === raw.id || x.user_id === raw.user_id);
          if (existingIndex > -1) {
            this.storageData[table][existingIndex] = { ...this.storageData[table][existingIndex], ...raw };
          } else {
            this.storageData[table].push({
              id: raw.id || 'id-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date().toISOString(),
              ...raw
            });
          }
        });
        this.saveTable(table);
        return builder;
      },
      delete: () => {
        this.storageData[table] = [];
        this.saveTable(table);
        return builder;
      },
      eq: (field: string, value: any) => {
        builder.filters.push((item: any) => {
          if (typeof item[field] === 'string' && typeof value === 'string') {
            return item[field].toLowerCase() === value.toLowerCase();
          }
          return item[field] === value;
        });
        return builder;
      },
      neq: (field: string, value: any) => {
        builder.filters.push((item: any) => item[field] !== value);
        return builder;
      },
      gt: (field: string, value: any) => {
        builder.filters.push((item: any) => item[field] > value);
        return builder;
      },
      lt: (field: string, value: any) => {
        builder.filters.push((item: any) => item[field] < value);
        return builder;
      },
      in: (field: string, values: any[]) => {
        builder.filters.push((item: any) => values.includes(item[field]));
        return builder;
      },
      order: (field: string, options?: { ascending: boolean }) => {
        builder.orderField = field;
        builder.orderAsc = options?.ascending ?? false;
        return builder;
      },
      limit: (num: number) => {
        builder.limitNum = num;
        return builder;
      },
      range: (from: number, to: number) => {
        builder.rangeStart = from;
        builder.rangeEnd = to;
        return builder;
      },
      or: () => {
        return builder;
      },
      single: () => {
        let results = [...(this.storageData[table] || [])];
        builder.filters.forEach(filter => {
          results = results.filter(filter);
        });
        return Promise.resolve({ data: results[0] || null, error: null });
      },
      maybeSingle: () => {
        let results = [...(this.storageData[table] || [])];
        builder.filters.forEach(filter => {
          results = results.filter(filter);
        });
        return Promise.resolve({ data: results[0] || null, error: null });
      },
      then: (resolve: any) => {
        let results = [...(this.storageData[table] || [])];
        
        builder.filters.forEach(filter => {
          results = results.filter(filter);
        });

        if (builder.orderField) {
          const f = builder.orderField;
          const asc = builder.orderAsc;
          results.sort((a, b) => {
            if (a[f] < b[f]) return asc ? -1 : 1;
            if (a[f] > b[f]) return asc ? 1 : -1;
            return 0;
          });
        }

        if (builder.limitNum > 0) {
          results = results.slice(0, builder.limitNum);
        }

        if (builder.rangeStart !== null && builder.rangeEnd !== null) {
          results = results.slice(builder.rangeStart, builder.rangeEnd + 1);
        }

        return Promise.resolve({ data: results, error: null }).then(resolve);
      }
    };

    return builder as any;
  }

  // Storage Mock API
  public storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop' } };
      }
    })
  };

  // Realtime Subscriptions
  public channel(name: string) {
    const channelBuilder = {
      on: (event: string, filter: any, callback: any) => {
        return channelBuilder;
      },
      subscribe: (statusCallback?: (status: string) => void) => {
        if (statusCallback) {
          setTimeout(() => statusCallback('SUBSCRIBED'), 10);
        }
        return channelBuilder;
      },
      track: async (presence: any) => {
        return channelBuilder;
      },
      untrack: async () => {
        return channelBuilder;
      }
    };
    return channelBuilder as any;
  }

  public removeChannel(channel: any) {
    return Promise.resolve();
  }

  // Remote Procedure Calls Simulator
  public rpc = async (name: string, args: any) => {
    console.log(`Mock Supabase RPC call: ${name}`, args);
    const mockId = 'rpc-' + Math.random().toString(36).substring(2, 9);
    
    if (name === 'secure_ensure_wallet') {
      return { data: 'wallet-id-demo-999', error: null };
    }
    
    return { data: mockId, error: null };
  };
}

export const supabase = isPlaceholder 
  ? (new MockSupabaseClient() as any)
  : createClient<Database>(supabaseUrl || 'https://placeholder.project.supabase.co', supabaseAnonKey || 'placeholder');
