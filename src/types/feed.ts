import type { Profile } from './index';

export interface FeedPost {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string;
  description: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  hustler_id: string;
  
  // Implicit linkage enabling direct hiring without context shifting
  service_id: string | null;
  service_title: string | null;
  service_starting_price: number | null;
  currency: string; // e.g., 'NGN', 'USD'

  // Expanded profile details populated from join queries
  hustler: Profile & {
    hustler_title?: string;
    rating_average?: number;
  };
}