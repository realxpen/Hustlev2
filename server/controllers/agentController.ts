import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { agentService } from '../services/agentService';
import { agentRepository } from '../repositories/agentRepository';

export class AgentController {
  /**
   * POST /agent/apply
   * Allows approved hustlers to promote themselves to Agency Managers.
   */
  public apply(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'creator-sophia'; // sandbox default
      const { agencyName, bio } = req.body;

      if (!agencyName) {
        res.status(400).json({
          success: false,
          error: "Agency name is required for registration."
        });
        return;
      }

      const application = agentService.applyToBecomeAgent(userId, agencyName, bio);
      res.status(200).json({
        success: true,
        message: "Agency application approved and manager privileges granted instantly.",
        application
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to submit agent application."
      });
    }
  }

  /**
   * POST /agent/assign
   * Prompts invite setup or assigns a specialist to the agency.
   */
  public assign(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'creator-sophia'; // sandbox default
      const { hustlerId, commissionPercentage } = req.body;

      if (!hustlerId) {
        res.status(400).json({
          success: false,
          error: "Specialist/Hustler identifier is required."
        });
        return;
      }

      const rateNum = Number(commissionPercentage);
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        res.status(400).json({
          success: false,
          error: "Invalid commission percentage. Value must be between 0 and 100."
        });
        return;
      }

      const relationship = agentService.assignHustler(userId, hustlerId, rateNum);
      res.status(200).json({
        success: true,
        message: "Manager request successfully created and dispatched to creator's feed.",
        relationship
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to assign hustler relationship."
      });
    }
  }

  /**
   * GET /agent/dashboard
   * Returns fully formulated dashboard stats + overseen bookings + commission histories.
   */
  public getDashboard(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'creator-sophia'; // sandbox default
      const analytics = agentService.getAgentDashboardData(userId);
      const bookings = agentService.getOverseenBookings(userId);
      const commissionHistory = agentRepository.findCommissionsByAgentId(userId);

      res.status(200).json({
        success: true,
        analytics,
        bookings,
        commissionHistory
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve agent control metrics."
      });
    }
  }

  /**
   * GET /agent/hustlers
   * Returns list of managed/invited specialist roster for this agency.
   */
  public getHustlers(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'creator-sophia'; // sandbox default
      const hustlers = agentService.getManagedHustlers(userId);

      res.status(200).json({
        success: true,
        hustlers
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch managed specialist roster."
      });
    }
  }

  /**
   * POST /agent/relationship/respond
   * Allows specialists/creators to accept or reject agency partnerships directly.
   */
  public respondToProposal(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: "Authentication required." });
        return;
      }

      const { relationshipId, status } = req.body;
      if (!relationshipId || !status || !['active', 'revoked'].includes(status)) {
        res.status(400).json({ success: false, error: "Missing or invalid payload inputs." });
        return;
      }

      const relationship = agentRepository.findRelationshipById(relationshipId);
      if (!relationship) {
        res.status(404).json({ success: false, error: "Relationship request of this ID not found." });
        return;
      }

      // Safeguard: Only the recipient hustler are allowed to respond
      if (relationship.hustler_id !== userId) {
        res.status(403).json({ success: false, error: "Access denied. Only the target creator can confirm agency invites." });
        return;
      }

      const updated = agentRepository.updateRelationshipStatus(relationshipId, status);
      res.status(200).json({
        success: true,
        message: `Successfully resolved proposal status to "${status}".`,
        relationship: updated
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to resolve agency proposal." });
    }
  }

  /**
   * POST /agent/permissions
   * Allows agency manager to update permissions of target relationships.
   */
  public updatePermissions(req: AuthenticatedRequest, res: Response): void {
    try {
      const { relationshipId, permissions } = req.body;
      if (!relationshipId || !permissions) {
        res.status(400).json({ success: false, error: "relationshipId and permissions payload is required." });
        return;
      }

      const result = agentRepository.updatePermissions(relationshipId, permissions);
      if (!result) {
        res.status(404).json({ success: false, error: "Target permissions mapping not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Roster permissions successfully parameterized.",
        permissions: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to configure relationship permissions." });
    }
  }
}

export const agentController = new AgentController();
