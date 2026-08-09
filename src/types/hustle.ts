export type UserRole = 'client' | 'provider' | 'learner';

export interface HustleUser {
  id: string;
  name: string;
  avatar_url: string;
  trust_score: number;
  bio?: string;
}

export interface ContentPost {
  id: string;
  video_url: string;
  description: string;
  skill_tag: string;
  base_price: number;
  likes_count: number;
  is_liked_by_user?: boolean;
  provider: HustleUser;
}

export interface CreateBookingPayload {
  provider_id: string;
  skill_tag: string;
  scheduled_date: string;
  requirements: string;
  budget: number;
}