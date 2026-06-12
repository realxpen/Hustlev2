import { UserProfile } from './profile';

export interface AgentApplication {
  id: string;
  user_id: string;
  agency_name: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_metadata: {
    bio?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface HustlerAgent {
  id: string;
  agent_id: string;
  hustler_id: string;
  commission_percentage: number;
  status: 'pending' | 'active' | 'revoked';
  created_at: string;
  updated_at: string;
  hustler_profile?: UserProfile | null;
  agent_profile?: UserProfile | null;
  permissions?: AgentPermission | null;
}

export interface AgentPermission {
  id: string;
  relationship_id: string;
  can_manage_bookings: boolean;
  can_view_earnings: boolean;
  can_edit_services: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentCommission {
  id: string;
  agent_id: string;
  hustler_id: string;
  booking_id: string;
  booking_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: 'pending' | 'paid';
  created_at: string;
}

export interface AgentPerformanceStat {
  hustlerId: string;
  hustlerName: string;
  bookingsCount: number;
  totalEarnings: number;
  commissionGenerated: number;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface AgentAnalytics {
  totalRevenue: number;
  pendingCommissions: number;
  hustlerCounts: {
    total: number;
    active: number;
    pending: number;
  };
  monthlyRevenueSeries: MonthlyRevenue[];
  performanceStats: AgentPerformanceStat[];
  growthRate: number;
  averageCommission: number;
}
