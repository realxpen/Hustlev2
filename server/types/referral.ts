export interface ReferralData {
  referralCode: string;
  referralLink: string;
  invitesSentCount: number;
  successfulSignupsCount: number;
  pendingSignupsCount: number;
  rewardsBalance: number;
  rewardsXp: number;
  flaggedCount: number;
}

export interface ReferralInvitation {
  id: string;
  referrerId: string;
  inviteeName: string;
  inviteeEmail: string;
  status: 'pending' | 'signed_up' | 'declined' | 'flagged';
  rewardsAwarded: boolean;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  fraudReason?: string;
}
