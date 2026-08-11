import e from 'express';
import type { Profile } from '@/src/types/index';

export interface HistoricalJobReview {
  id: string;
  client_name: string;
  service_title: string;
  score_rating: number; // e.g., 5
  review_text: string;
  completed_at: string;
  total_payout_amount: number;
  currency: string;
}

export interface ExtendedHustlerProfile extends Profile {
  full_name: string | null;
  hustler_title?: string;
  rating_average: number | null;
  completed_jobs_count: number;
  verified_credentials: string[]; // e.g., ['Govt ID Verified', 'Plumbing Guild Cert']
  reviews: HistoricalJobReview[];
}