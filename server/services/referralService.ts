import { ReferralRepository } from "../repositories/referralRepository";
import { ReferralData, ReferralInvitation } from "../types/referral";

// Common temporary and disposable email domains to block
const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamail.com",
  "trashmail.com",
  "getairmail.com"
];

export class ReferralService {
  private repository: ReferralRepository;

  constructor() {
    this.repository = ReferralRepository.getInstance();
  }

  /**
   * Evaluates invitation elements against several anti-fraud rules.
   * Returns a description of the fraud if flagged, or null if clean.
   */
  public detectFraud(
    referrerId: string,
    targetEmail: string,
    targetName: string,
    ipAddress?: string,
    userAgent?: string
  ): string | null {
    const emailLower = targetEmail.trim().toLowerCase();
    const domain = emailLower.split("@")[1];

    // 1. Disposable Email domain check
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      return `Blocked: Disposable email provider detected (@${domain})`;
    }

    // 2. Self-referral / duplicate detection (checking email pattern aliases)
    // Strip "+" tags from gmail style addresses (e.g. user+alias@gmail.com -> user@gmail.com)
    const normalizedEmail = emailLower.replace(/\+.+@/, "@");
    
    // Check if the user is using an alias of their own email or refers themselves
    // Let's assume a mock check if target email matches user ID (simulating same user context)
    if (referrerId && normalizedEmail.startsWith(referrerId.toLowerCase())) {
      return "Security Blocked: Self-referral attempt detected";
    }

    // 3. Spammer velocity tracking (anti-sybil check)
    const allInvites = this.repository.getAllInvitations();
    const referrerInvites = allInvites.filter(inv => inv.referrerId === referrerId);
    
    // Check invitations created by this referrer in the last 10 minutes (using mock calculation or timestamps)
    const shortAgo = Date.now() - 10 * 60 * 1000;
    const rapidInvites = referrerInvites.filter(
      inv => new Date(inv.createdAt).getTime() > shortAgo
    );

    if (rapidInvites.length >= 5) {
      return "Blocked: Too many invitations created too quickly (Rate limit: 5 per 10min)";
    }

    // 4. IP-Address duplication check (multiple referrers using the same device/IP)
    if (ipAddress && ipAddress !== "127.0.0.1" && ipAddress !== "::1") {
      const distinctReferrersOnIp = new Set(
        allInvites
          .filter(inv => inv.ipAddress === ipAddress)
          .map(inv => inv.referrerId)
      );

      // If more than 2 distinct system accounts use the exact same IP address to invite people, suspect a device farm / botting
      if (distinctReferrersOnIp.size >= 2 && !distinctReferrersOnIp.has(referrerId)) {
        return "Blocked: Suspicious network device duplication. IP address shared by multiple referrers.";
      }
    }

    // 5. Existing referrals with same target email address (Anti-Double rewards check)
    const preExisting = this.repository.getInvitationByEmail(emailLower);
    if (preExisting) {
      return "Blocked: Candidate has already been invited or registered";
    }

    return null;
  }

  /**
   * Tracks a brand new referral invite request, enforcing full security checks.
   */
  public async createReferral(
    referrerId: string,
    targetName: string,
    targetEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ReferralInvitation> {
    if (!targetName || !targetEmail) {
      throw new Error("Target nominee name and email address are both required");
    }

    // Run active fraud protection filters
    const fraudReason = this.detectFraud(referrerId, targetEmail, targetName, ipAddress, userAgent);
    
    const isFraudulent = fraudReason !== null;

    const newInvite: ReferralInvitation = {
      id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referrerId,
      inviteeName: targetName.trim(),
      inviteeEmail: targetEmail.trim().toLowerCase(),
      status: isFraudulent ? "flagged" : "pending",
      rewardsAwarded: false,
      createdAt: new Date().toISOString(),
      ipAddress,
      userAgent,
      fraudReason: fraudReason || undefined
    };

    const savedInvite = this.repository.createInvitation(newInvite);
    
    // If flagged directly due to high threat, throw immediate error so client UI displays it
    if (isFraudulent) {
      throw new Error(`Referral flagged as suspicious: ${fraudReason}`);
    }

    return savedInvite;
  }

  /**
   * Accesses detailed stats of the logged-in referrer
   */
  public async getStats(userId: string): Promise<{ stats: ReferralData; logs: ReferralInvitation[] }> {
    const stats = this.repository.getReferralData(userId);
    const logs = this.repository.getInvitationsByReferrer(userId);
    return { stats, logs };
  }

  /**
   * Simulates/Resolves a signup trigger to reward the partner.
   * If the invitation is flagged or fraudulent, rewards are legally frozen & withheld.
   */
  public async rewardReferral(email: string): Promise<ReferralInvitation> {
    if (!email) {
      throw new Error("Recipient email parameter is required to identify referral state");
    }

    const invite = this.repository.getInvitationByEmail(email.toLowerCase());
    if (!invite) {
      throw new Error(`No invite found matching email: ${email}`);
    }

    if (invite.status === "flagged") {
      throw new Error(`Cannot issue split payouts: This referral is flagged as a security/fraud hazard (${invite.fraudReason})`);
    }

    const updated = this.repository.updateInvitationStatus(invite.id, "signed_up");
    if (!updated) {
      throw new Error("Failed to update status and allocate rewards Ledger entry");
    }

    return updated;
  }

  /**
   * Allows the referrer to withdraw accrued rewards balance
   */
  public async claimPayout(userId: string): Promise<{ claimed: number; currentBalance: number }> {
    const data = this.repository.getReferralData(userId);
    const balance = data.rewardsBalance;
    
    if (balance <= 0) {
      throw new Error("Insufficient rewards balance. Accumulate referral conversions first.");
    }

    const claimed = this.repository.claimRewards(userId);
    return {
      claimed,
      currentBalance: 0
    };
  }
}
