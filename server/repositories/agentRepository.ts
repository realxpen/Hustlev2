import crypto from 'crypto';
import { AgentApplication, HustlerAgent, AgentPermission, AgentCommission } from '../types/agent';
import { profileRepository } from './profileRepository';
import { bookingRepository } from './bookingRepository';

export class AgentRepository {
  private applications: Map<string, AgentApplication> = new Map();
  private relationships: Map<string, HustlerAgent> = new Map();
  private permissions: Map<string, AgentPermission> = new Map();
  private commissions: Map<string, AgentCommission> = new Map();

  constructor() {
    this.seedAgentData();
  }

  private seedAgentData() {
    const now = new Date().toISOString();

    // 1. Seed Sophia Swift's Agency Application
    const sophiaApp: AgentApplication = {
      id: "agent-app-sophia",
      user_id: "creator-sophia",
      agency_name: "Swift UX Agency",
      status: "approved",
      submission_metadata: {
        bio: "Specialist Agency for Elite visual UI/UX builders."
      },
      created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 29 * 24 * 3600000).toISOString()
    };
    this.applications.set(sophiaApp.id, sophiaApp);

    // Ensure Sophia's profile is saved with correct agent parameters
    const sophiaProfile = profileRepository.findById("creator-sophia");
    if (sophiaProfile) {
      sophiaProfile.isAgent = true;
      sophiaProfile.agencyName = "Swift UX Agency";
      sophiaProfile.managedHustlersCount = 2; // Real seeded partners
      profileRepository.save(sophiaProfile);
    }

    // 2. Seed relationships with Hustlers (Marcus & Alex) under Sophia Swift's Agency
    const rel1: HustlerAgent = {
      id: "rel-sophia-marcus",
      agent_id: "creator-sophia",
      hustler_id: "creator-marcus",
      commission_percentage: 15,
      status: "active",
      created_at: new Date(Date.now() - 28 * 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 28 * 24 * 3600000).toISOString()
    };
    
    const rel2: HustlerAgent = {
      id: "rel-sophia-alex",
      agent_id: "creator-sophia",
      hustler_id: "creator-alex",
      commission_percentage: 12,
      status: "active",
      created_at: new Date(Date.now() - 25 * 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 25 * 24 * 3600000).toISOString()
    };

    // Seed draft / pending invite request
    const rel3: HustlerAgent = {
      id: "rel-sophia-demo",
      agent_id: "creator-sophia",
      hustler_id: "demo-hustler-id",
      commission_percentage: 20,
      status: "pending",
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
    };

    this.relationships.set(rel1.id, rel1);
    this.relationships.set(rel2.id, rel2);
    this.relationships.set(rel3.id, rel3);

    // 3. Seed corresponding permissions for the partners
    const perm1: AgentPermission = {
      id: "perm-sophia-marcus",
      relationship_id: "rel-sophia-marcus",
      can_manage_bookings: true,
      can_view_earnings: true,
      can_edit_services: false,
      created_at: now,
      updated_at: now
    };

    const perm2: AgentPermission = {
      id: "perm-sophia-alex",
      relationship_id: "rel-sophia-alex",
      can_manage_bookings: true,
      can_view_earnings: false,
      can_edit_services: true,
      created_at: now,
      updated_at: now
    };

    this.permissions.set(perm1.id, perm1);
    this.permissions.set(perm2.id, perm2);

    // 4. Seed Commission items for beautiful historical stats
    const comm1: AgentCommission = {
      id: "commission-1",
      agent_id: "creator-sophia",
      hustler_id: "creator-marcus",
      booking_id: "booking-demo-1",
      booking_amount: 90,
      commission_amount: 13.5, // 15% of $90
      commission_percentage: 15,
      status: "paid",
      created_at: new Date(Date.now() - 15 * 24 * 3600000).toISOString()
    };

    const comm2: AgentCommission = {
      id: "commission-2",
      agent_id: "creator-sophia",
      hustler_id: "creator-alex",
      booking_id: "booking-seeded-alex",
      booking_amount: 150,
      commission_amount: 18.0, // 12% of $150
      commission_percentage: 12,
      status: "pending",
      created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
    };

    this.commissions.set(comm1.id, comm1);
    this.commissions.set(comm2.id, comm2);
  }

  // Application Queries
  public findApplicationById(id: string): AgentApplication | null {
    return this.applications.get(id) || null;
  }

  public findApplicationByUserId(userId: string): AgentApplication | null {
    return Array.from(this.applications.values()).find(a => a.user_id === userId) || null;
  }

  public createApplication(app: Omit<AgentApplication, 'id' | 'created_at' | 'updated_at'>): AgentApplication {
    const id = `agent-app-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newApp: AgentApplication = {
      ...app,
      id,
      created_at: now,
      updated_at: now
    };
    this.applications.set(id, newApp);
    return newApp;
  }

  public updateApplicationStatus(id: string, status: 'pending' | 'approved' | 'rejected'): AgentApplication | null {
    const app = this.applications.get(id);
    if (!app) return null;
    app.status = status;
    app.updated_at = new Date().toISOString();
    return app;
  }

  // Relationship / Assignment Queries
  public findRelationshipById(id: string): HustlerAgent | null {
    return this.relationships.get(id) || null;
  }

  public findRelationshipsByAgentId(agentId: string, status?: 'pending' | 'active' | 'revoked'): HustlerAgent[] {
    let list = Array.from(this.relationships.values()).filter(r => r.agent_id === agentId);
    if (status) {
      list = list.filter(r => r.status === status);
    }
    return list;
  }

  public findRelationshipsByHustlerId(hustlerId: string, status?: 'pending' | 'active' | 'revoked'): HustlerAgent[] {
    let list = Array.from(this.relationships.values()).filter(r => r.hustler_id === hustlerId);
    if (status) {
      list = list.filter(r => r.status === status);
    }
    return list;
  }

  public findRelationshipByAgentAndHustler(agentId: string, hustlerId: string): HustlerAgent | null {
    return Array.from(this.relationships.values()).find(
      r => r.agent_id === agentId && r.hustler_id === hustlerId
    ) || null;
  }

  public createRelationship(relationship: Omit<HustlerAgent, 'id' | 'created_at' | 'updated_at'>): HustlerAgent {
    const id = `rel-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newRel: HustlerAgent = {
      ...relationship,
      id,
      created_at: now,
      updated_at: now
    };
    this.relationships.set(id, newRel);

    // Auto-create initial default permissions
    const permId = `perm-${crypto.randomUUID()}`;
    const defaultPerm: AgentPermission = {
      id: permId,
      relationship_id: id,
      can_manage_bookings: true,
      can_view_earnings: true,
      can_edit_services: false,
      created_at: now,
      updated_at: now
    };
    this.permissions.set(permId, defaultPerm);

    // Attach permissions
    newRel.permissions = defaultPerm;

    return newRel;
  }

  public updateRelationshipStatus(id: string, status: 'pending' | 'active' | 'revoked'): HustlerAgent | null {
    const rel = this.relationships.get(id);
    if (!rel) return null;
    rel.status = status;
    rel.updated_at = new Date().toISOString();
    this.relationships.set(id, rel);
    
    // Dynamically update managed hustler metrics for corresponding Agent and Hustler
    this.recalculateManagedHustlerCounts(rel.agent_id);
    return rel;
  }

  private recalculateManagedHustlerCounts(agentId: string) {
    const activePartners = this.findRelationshipsByAgentId(agentId, 'active');
    const agentProfile = profileRepository.findById(agentId);
    if (agentProfile) {
      agentProfile.managedHustlersCount = activePartners.length;
      profileRepository.save(agentProfile);
    }
  }

  // Permissions
  public findPermissionsByRelationshipId(relationshipId: string): AgentPermission | null {
    return Array.from(this.permissions.values()).find(p => p.relationship_id === relationshipId) || null;
  }

  public updatePermissions(relationshipId: string, updates: Partial<AgentPermission>): AgentPermission | null {
    const perm = this.findPermissionsByRelationshipId(relationshipId);
    if (!perm) return null;
    Object.assign(perm, {
      ...updates,
      updated_at: new Date().toISOString()
    });
    this.permissions.set(perm.id, perm);
    return perm;
  }

  // Commission Tracking & Earnings
  public createCommission(commission: Omit<AgentCommission, 'id' | 'created_at'>): AgentCommission {
    const id = `comm-${crypto.randomUUID()}`;
    const newComm: AgentCommission = {
      ...commission,
      id,
      created_at: new Date().toISOString()
    };
    this.commissions.set(id, newComm);
    return newComm;
  }

  public findCommissionsByAgentId(agentId: string, status?: 'pending' | 'paid'): AgentCommission[] {
    let list = Array.from(this.commissions.values()).filter(c => c.agent_id === agentId);
    if (status) {
      list = list.filter(c => c.status === status);
    }
    return list;
  }

  public updateCommissionStatus(id: string, status: 'pending' | 'paid'): AgentCommission | null {
    const comm = this.commissions.get(id);
    if (!comm) return null;
    comm.status = status;
    this.commissions.set(id, comm);
    return comm;
  }
}

export const agentRepository = new AgentRepository();
