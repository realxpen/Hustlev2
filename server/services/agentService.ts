import { agentRepository } from '../repositories/agentRepository';
import { profileRepository } from '../repositories/profileRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { notificationService } from './notificationService';
import { AgentApplication, HustlerAgent, AgentAnalytics, AgentPermission, AgentCommission, MonthlyRevenue, AgentPerformanceStat } from '../types/agent';
import { UserProfile } from '../types/profile';

export class AgentService {
  /**
   * Only approved hustlers can apply to become agents.
   * If they are a Hustler, their profile is promoted to Agent status.
   */
  public applyToBecomeAgent(userId: string, agencyName: string, bio?: string): AgentApplication {
    const profile = profileRepository.findById(userId);
    if (!profile) {
      throw new Error("User profile not found.");
    }

    if (!profile.isHustler) {
      throw new Error("Action Denied: Only approved hustlers can become agents.");
    }

    // Check if they already have an application
    const existing = agentRepository.findApplicationByUserId(userId);
    if (existing) {
      if (existing.status === 'approved') {
        throw new Error("You are already an approved agency manager.");
      }
      return existing;
    }

    // Create the application
    const app = agentRepository.createApplication({
      user_id: userId,
      agency_name: agencyName,
      status: 'approved', // Auto-approve for seamless demonstration/sandbox operations
      submission_metadata: { bio }
    });

    // Update profile characteristics
    profile.isAgent = true;
    profile.agencyName = agencyName;
    profileRepository.save(profile);

    // Feed a notification log
    notificationService.createAndDeliverNotification({
      recipient_id: userId,
      actor_id: null,
      type: 'agent_approved',
      entity_id: app.id,
      entity_type: 'agent_application',
      message: `Congratulations! Your agency "${agencyName}" has been approved! Enter the Agency control center.`,
      priority: 'high'
    });

    return app;
  }

  /**
   * Assign/Invite a hustler to be managed by this Agent.
   * Verifies both roles are aligned.
   */
  public assignHustler(agentId: string, hustlerId: string, commissionPercentage: number): HustlerAgent {
    const agentProfile = profileRepository.findById(agentId);
    if (!agentProfile || !agentProfile.isAgent) {
      throw new Error("Action Denied: Requester is not an active agency manager.");
    }

    const hustlerProfile = profileRepository.findById(hustlerId);
    if (!hustlerProfile) {
      throw new Error("Target specialist profile not found.");
    }

    if (!hustlerProfile.isHustler) {
      throw new Error("Denied: You can only assign/invite specialists who are active Hustlers.");
    }

    // Check if the association already exists
    const existing = agentRepository.findRelationshipByAgentAndHustler(agentId, hustlerId);
    if (existing) {
      if (existing.status === 'active') {
        throw new Error("This specialist is already active on your roster.");
      }
      if (existing.status === 'pending') {
        throw new Error("An invitation is already outstanding under this relationship.");
      }
      // Re-activate if revoked
      return agentRepository.updateRelationshipStatus(existing.id, 'pending')!;
    }

    // Create partnership association
    const rel = agentRepository.createRelationship({
      agent_id: agentId,
      hustler_id: hustlerId,
      commission_percentage: commissionPercentage,
      status: 'pending' // starts pending until accepted by the hustler
    });

    // Create an intuitive invite notification for the creator/hustler
    notificationService.createAndDeliverNotification({
      recipient_id: hustlerId,
      actor_id: agentId,
      type: 'agent_request',
      entity_id: rel.id,
      entity_type: 'hustler_agent',
      message: `Agency "${agentProfile.agencyName || 'Elite Team'}" requested to manage your listings for a ${commissionPercentage}% commission fee.`,
      priority: 'high'
    });

    return rel;
  }

  /**
   * Retrieves the full array of hustlers managed by this Agent
   */
  public getManagedHustlers(agentId: string): HustlerAgent[] {
    const rawRels = agentRepository.findRelationshipsByAgentId(agentId);
    
    // Enrich with profile profiles on both ends
    return rawRels.map(rel => {
      const hProfile = profileRepository.findById(rel.hustler_id) || null;
      const aProfile = profileRepository.findById(rel.agent_id) || null;
      const permissions = agentRepository.findPermissionsByRelationshipId(rel.id) || null;
      return {
        ...rel,
        hustler_profile: hProfile,
        agent_profile: aProfile,
        permissions
      };
    });
  }

  /**
   * Compiles the comprehensive control dashboard for an Agent,
   * tracking performance, managing bookings, and aggregating performance metrics.
   */
  public getAgentDashboardData(agentId: string): AgentAnalytics {
    const agentProfile = profileRepository.findById(agentId);
    if (!agentProfile || !agentProfile.isAgent) {
      throw new Error("Profile has no Agency privileges initialized.");
    }

    const relationships = agentRepository.findRelationshipsByAgentId(agentId);
    const activeRoster = relationships.filter(r => r.status === 'active');
    const pendingRoster = relationships.filter(r => r.status === 'pending');

    const hustlerCounts = {
      total: relationships.length,
      active: activeRoster.length,
      pending: pendingRoster.length
    };

    // Gather all active roster IDs
    const rosterIds = activeRoster.map(r => r.hustler_id);

    // Sum overall commissions earned
    const paidComms = agentRepository.findCommissionsByAgentId(agentId, 'paid');
    const pendingComms = agentRepository.findCommissionsByAgentId(agentId, 'pending');

    const totalRevenue = paidComms.reduce((acc, c) => acc + c.commission_amount, 0);
    const pendingCommissions = pendingComms.reduce((acc, c) => acc + c.commission_amount, 0);

    // Gather and calculate average commission rate percentage
    const averageCommission = activeRoster.length > 0
      ? Math.round(activeRoster.reduce((sum, r) => sum + r.commission_percentage, 0) / activeRoster.length)
      : 0;

    // Monthly revenue aggregate (last 6 months)
    const monthlyRevenueSeries: MonthlyRevenue[] = this.calculateMonthlyRevenue(paidComms);

    // Individual Performance stat calculations
    const performanceStats: AgentPerformanceStat[] = activeRoster.map(rel => {
      const hustler = profileRepository.findById(rel.hustler_id);
      const name = hustler ? hustler.fullName : `Specialist ${rel.hustler_id.slice(0, 5)}`;
      
      // Calculate bookings aggregate
      const hustlerBookings = bookingRepository.findBySellerId(rel.hustler_id);
      const totalHustlerEarnings = hustlerBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.amount, 0);

      const generatedCommissions = paidComms
        .filter(c => c.hustler_id === rel.hustler_id)
        .reduce((sum, c) => sum + c.commission_amount, 0);

      return {
        hustlerId: rel.hustler_id,
        hustlerName: name,
        bookingsCount: hustlerBookings.length,
        totalEarnings: totalHustlerEarnings,
        commissionGenerated: generatedCommissions
      };
    });

    // Calculate growth rate comparing the last two months
    let growthRate = 0;
    if (monthlyRevenueSeries.length >= 2) {
      const lastMonth = monthlyRevenueSeries[monthlyRevenueSeries.length - 1].amount;
      const prevMonth = monthlyRevenueSeries[monthlyRevenueSeries.length - 2].amount;
      if (prevMonth > 0) {
        growthRate = Math.round(((lastMonth - prevMonth) / prevMonth) * 100);
      }
    }

    return {
      totalRevenue,
      pendingCommissions,
      hustlerCounts,
      averageCommission,
      monthlyRevenueSeries,
      performanceStats,
      growthRate
    };
  }

  /**
   * Oversee Bookings belonging to any managed hustler/specialist
   */
  public getOverseenBookings(agentId: string): any[] {
    const activeRosterIds = agentRepository.findRelationshipsByAgentId(agentId, 'active')
      .map(r => r.hustler_id);

    const allBookings = bookingRepository.findAll();
    const overseen = allBookings.filter(b => activeRosterIds.includes(b.seller_id));

    // Enrich overseen bookings with provider profiles
    return overseen.map(b => {
      const provider = profileRepository.findById(b.seller_id) || null;
      const client = profileRepository.findById(b.buyer_id) || null;
      return {
        ...b,
        provider_profile: provider,
        client_profile: client
      };
    });
  }

  private calculateMonthlyRevenue(commissions: AgentCommission[]): MonthlyRevenue[] {
    const monthMap: Record<string, number> = {};
    const now = new Date();
    
    // Generate empty keys of last 4 months to guarantee beautiful display chart renders always
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      monthMap[monthLabel] = 0;
    }

    // Populate actuals
    commissions.forEach(comm => {
      const date = new Date(comm.created_at);
      const label = date.toLocaleString('default', { month: 'short' });
      if (monthMap[label] !== undefined) {
        monthMap[label] += comm.commission_amount;
      } else {
        monthMap[label] = comm.commission_amount;
      }
    });

    return Object.entries(monthMap).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100
    }));
  }
}

export const agentService = new AgentService();
