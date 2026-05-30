import { Profile } from './index';

export interface AgentApplication {
  id: string;
  user_id: string;
  agency_name: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_metadata?: any;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface HustlerAgent {
  id: string;
  hustler_id: string;
  agent_id: string;
  status: 'pending' | 'active' | 'revoked';
  commission_percentage: number;
  created_at: string;
  hustler_profile?: Profile | null;
  agent_profile?: Profile | null;
}

export interface AgentPermission {
  id: string;
  relationship_id: string;
  manage_bookings: boolean;
  manage_listings: boolean;
  message_clients: boolean;
  analytics_access: boolean;
}

export interface AgentCommission {
  id: string;
  booking_id: string;
  agent_id: string;
  hustler_id: string;
  commission_amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  booking?: {
    id: string;
    total_price: number;
    status: string;
    buyer_id: string;
  } | null;
  hustler_profile?: Profile | null;
}

export interface AgentAnalytics {
  totalRevenue: number;
  pendingCommissions: number;
  hustlerCounts: {
    total: number;
    active: number;
    pending: number;
  };
  monthlyRevenueSeries: Array<{ month: string; amount: number }>;
  performanceStats: Array<{
    hustlerId: string;
    hustlerName: string;
    bookingsCount: number;
    totalEarnings: number;
    commissionGenerated: number;
  }>;
  growthRate?: number;
  averageCommission?: number;
}
