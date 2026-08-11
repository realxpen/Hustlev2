export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export type ReportTargetType = 'post' | 'comment' | 'profile' | 'message' | 'service' | 'product' | 'training' | 'story';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string | null;
  target_id: string;
  target_type: ReportTargetType;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export type ModerationPriority = 'low' | 'medium' | 'high' | 'critical';
export type ModerationQueueStatus = 'open' | 'in_review' | 'closed';

export interface ModerationQueueItem {
  id: string;
  report_id: string | null;
  target_id: string;
  target_type: ReportTargetType;
  severity_score: number;
  priority: ModerationPriority;
  automated_flags: any[];
  status: ModerationQueueStatus;
  created_at: string;
}

export type ModerationStatus = 'approved' | 'flagged' | 'hidden' | 'removed';

export interface ContentModerationState {
  id: string;
  target_id: string;
  target_type: ReportTargetType;
  moderation_status: ModerationStatus;
  restriction_level: number;
  is_monetization_eligible: boolean;
  created_at: string;
  updated_at: string;
}

export type VerificationType = 'id' | 'business' | 'skill';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface CreatorVerification {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  submission_metadata: any;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ModerationLog {
  id: string;
  moderator_id: string | null;
  action_type: string;
  target_id: string;
  target_type: string;
  reason: string | null;
  old_state: any;
  new_state: any;
  created_at: string;
}

export interface PlatformStats {
  total_users: number;
  active_escrow: number;
  frozen_escrow: number;
  released_escrow: number;
  completed_escrow: number;
  monthly_revenue: number;
  open_disputes: number;
  pending_verifications: number;
  fraud_risk_count: number;
  booking_success_rate: number;
}
