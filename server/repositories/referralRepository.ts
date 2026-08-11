import { ReferralData, ReferralInvitation } from "../types/referral";

export class ReferralRepository {
  private static instance: ReferralRepository;

  // Key: userId
  private userReferrals: Map<string, ReferralData> = new Map();
  // Key: invitationId
  private invitations: Map<string, ReferralInvitation> = new Map();

  constructor() {
    this.seedReferralData();
  }

  public static getInstance(): ReferralRepository {
    if (!ReferralRepository.instance) {
      ReferralRepository.instance = new ReferralRepository();
    }
    return ReferralRepository.instance;
  }

  private seedReferralData() {
    // Seed some test users and logs
    const defaultData: ReferralData = {
      referralCode: "HUSTLE-JOIN-XPENS7",
      referralLink: "https://hustle.app/join?ref=XPENS7",
      invitesSentCount: 12,
      successfulSignupsCount: 4,
      pendingSignupsCount: 3,
      rewardsBalance: 85.00,
      rewardsXp: 240,
      flaggedCount: 0
    };

    const defaultInvites: ReferralInvitation[] = [
      {
        id: "ref-1",
        referrerId: "test-client-id",
        inviteeName: "Marcus Aurelius",
        inviteeEmail: "marcus.barber@gmail.com",
        status: "signed_up",
        rewardsAwarded: true,
        createdAt: "2026-06-08T10:00:00Z"
      },
      {
        id: "ref-2",
        referrerId: "test-client-id",
        inviteeName: "Juliana Santos",
        inviteeEmail: "jules.designs@ux.io",
        status: "signed_up",
        rewardsAwarded: true,
        createdAt: "2026-06-05T12:00:00Z"
      },
      {
        id: "ref-3",
        referrerId: "test-client-id",
        inviteeName: "Derrick Vance",
        inviteeEmail: "derrick.v@outlook.com",
        status: "pending",
        rewardsAwarded: false,
        createdAt: "2026-06-10T14:30:00Z"
      },
      {
        id: "ref-4",
        referrerId: "test-client-id",
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarahc.mktg@gmail.com",
        status: "signed_up",
        rewardsAwarded: true,
        createdAt: "2026-05-28T09:12:00Z"
      },
      {
        id: "ref-5",
        referrerId: "test-client-id",
        inviteeName: "Liam O'Connor",
        inviteeEmail: "liam@builders.ie",
        status: "pending",
        rewardsAwarded: false,
        createdAt: "2026-06-11T16:00:00Z"
      }
    ];

    this.userReferrals.set("test-client-id", defaultData);
    defaultInvites.forEach(inv => this.invitations.set(inv.id, inv));
  }

  public getReferralData(userId: string): ReferralData {
    if (!this.userReferrals.has(userId)) {
      const code = `HUSTLE-JOIN-${userId.substring(0, 6).toUpperCase()}`;
      const data: ReferralData = {
        referralCode: code,
        referralLink: `https://hustle.app/join?ref=${userId.substring(0, 6).toUpperCase()}`,
        invitesSentCount: 0,
        successfulSignupsCount: 0,
        pendingSignupsCount: 0,
        rewardsBalance: 0.00,
        rewardsXp: 0,
        flaggedCount: 0
      };
      this.userReferrals.set(userId, data);
    }
    return this.userReferrals.get(userId)!;
  }

  public getAllInvitations(): ReferralInvitation[] {
    return Array.from(this.invitations.values());
  }

  public getInvitationsByReferrer(userId: string): ReferralInvitation[] {
    return Array.from(this.invitations.values())
      .filter(inv => inv.referrerId === userId)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getInvitationByEmail(email: string): ReferralInvitation | undefined {
    return Array.from(this.invitations.values())
      .find(inv => inv.inviteeEmail.toLowerCase() === email.toLowerCase());
  }

  public createInvitation(invitation: ReferralInvitation): ReferralInvitation {
    this.invitations.set(invitation.id, invitation);
    
    // Update core aggregate numbers on user profiles metadata
    const userReferrals = this.getReferralData(invitation.referrerId);
    userReferrals.invitesSentCount += 1;
    if (invitation.status === 'pending') {
      userReferrals.pendingSignupsCount += 1;
    } else if (invitation.status === 'signed_up') {
      userReferrals.successfulSignupsCount += 1;
    } else if (invitation.status === 'flagged') {
      userReferrals.flaggedCount += 1;
    }

    this.userReferrals.set(invitation.referrerId, userReferrals);
    return invitation;
  }

  public updateInvitationStatus(invitationId: string, status: 'pending' | 'signed_up' | 'declined' | 'flagged'): ReferralInvitation | undefined {
    const inv = this.invitations.get(invitationId);
    if (!inv) return undefined;

    const oldStatus = inv.status;
    inv.status = status;
    this.invitations.set(invitationId, inv);

    const data = this.getReferralData(inv.referrerId);

    // Adjust aggregations based on status transformation transitions
    if (oldStatus === 'pending' && status === 'signed_up') {
      data.pendingSignupsCount = Math.max(0, data.pendingSignupsCount - 1);
      data.successfulSignupsCount += 1;
      
      // Award premium payouts!
      if (!inv.rewardsAwarded) {
        data.rewardsBalance += 20.00; // $20 Cash Bonus!
        data.rewardsXp += 50; // +50 Academy XPPoints!
        inv.rewardsAwarded = true;
      }
    } else if (oldStatus === 'pending' && status === 'declined') {
      data.pendingSignupsCount = Math.max(0, data.pendingSignupsCount - 1);
    } else if (oldStatus === 'pending' && status === 'flagged') {
      data.pendingSignupsCount = Math.max(0, data.pendingSignupsCount - 1);
      data.flaggedCount += 1;
    } else if (oldStatus === 'signed_up' && status === 'flagged') {
      data.successfulSignupsCount = Math.max(0, data.successfulSignupsCount - 1);
      data.flaggedCount += 1;
      // Deduct rewards if awarded
      if (inv.rewardsAwarded) {
        data.rewardsBalance = Math.max(0, data.rewardsBalance - 20.00);
        data.rewardsXp = Math.max(0, data.rewardsXp - 50);
        inv.rewardsAwarded = false;
      }
    }

    this.userReferrals.set(inv.referrerId, data);
    return inv;
  }

  public claimRewards(userId: string): number {
    const data = this.getReferralData(userId);
    const claimed = data.rewardsBalance;
    data.rewardsBalance = 0;
    this.userReferrals.set(userId, data);
    return claimed;
  }
}
