import { ServiceEntity } from "../types/service";

export class ServiceRepository {
  private services: Map<string, ServiceEntity> = new Map();

  constructor() {
    this.seedServices();
  }

  private seedServices() {
    const seedData: Partial<ServiceEntity>[] = [
      {
        id: "service-marcus-1",
        owner_id: "creator-marcus",
        title: "Elite Barber & Grooming Session",
        description: "Includes premium hair sculpting, beard details, hot towel treatment, skin hydration, and razor finishing.",
        category: "Grooming",
        pricing_type: "fixed",
        base_price: 90,
        delivery_time: "1 Hour",
        media: [
          { url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["Barber", "Beard Sculpting", "Classic Taper"],
        is_active: true,
        is_archived: false,
        availability: {
          appointment_only: true,
          schedule: {
            monday: ["09:00", "17:00"],
            tuesday: ["09:00", "17:00"],
            wednesday: ["09:00", "17:00"],
            thursday: ["09:00", "20:00"],
            friday: ["09:00", "21:00"],
            saturday: ["08:00", "22:00"]
          }
        },
        views_count: 342,
        saves_count: 55,
        orders_count: 142
      },
      {
        id: "service-marcus-2",
        owner_id: "creator-marcus",
        title: "Beard Sculpture & Trim Specialized Only",
        description: "Detailed shape up, volume pruning, organic skin-soothing oil dynamic massage, and direct hot towel shave outline.",
        category: "Grooming",
        pricing_type: "fixed",
        base_price: 45,
        delivery_time: "30 Min",
        media: [
          { url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["Trim", "Hot Shave", "Beard Oil"],
        is_active: true,
        is_archived: false,
        availability: {
          appointment_only: true,
          schedule: {
            monday: ["09:00", "17:00"],
            tuesday: ["09:00", "17:00"],
            wednesday: ["09:00", "17:00"],
            thursday: ["09:00", "20:00"],
            friday: ["09:00", "21:00"],
            saturday: ["08:00", "22:00"]
          }
        },
        views_count: 120,
        saves_count: 18,
        orders_count: 45
      },
      {
        id: "service-alex-1",
        owner_id: "creator-alex",
        title: "Automotive Cinema Clip & Drone Reel",
        description: "Professional multi-camera 4K automotive rolling shots, high-speed tracking clips, and customized organic sound engineering.",
        category: "Creative",
        pricing_type: "hourly",
        base_price: 150,
        delivery_time: "3 Days",
        media: [
          { url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["Cinematography", "Drone", "Color Grading", "Reel"],
        is_active: true,
        is_archived: false,
        availability: {
          appointment_only: false,
          custom_preferences: "Custom tracking schedule dynamically aligned with sunrise and golden hours settings.",
          schedule: {
            friday: ["15:00", "20:00"],
            saturday: ["06:00", "20:00"],
            sunday: ["06:00", "18:00"]
          }
        },
        views_count: 512,
        saves_count: 98,
        orders_count: 88
      },
      {
        id: "service-sophia-1",
        owner_id: "creator-sophia",
        title: "UX/UI Full Figma System Builder",
        description: "Creation of bespoke structural wireframes, tokenized variable libraries, scalable designs, and mock prototypes.",
        category: "Design & Tech",
        pricing_type: "custom",
        base_price: 1200,
        delivery_time: "10 Days",
        media: [
          { url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["Design System", "Figma", "UI/UX", "Interactive"],
        is_active: true,
        is_archived: false,
        availability: {
          appointment_only: true,
          custom_preferences: "Remote consult first. Bookings made 1-2 weeks in advance."
        },
        views_count: 890,
        saves_count: 145,
        orders_count: 67
      },
      {
        id: "mock-s1",
        owner_id: "demo-hustler-id",
        title: "Modern Mobile Web App Frontend",
        description: "Building ultra-fast responsive interactive mobile React frontends with Tailwind and Framer Motion.",
        category: "Tech",
        pricing_type: "fixed",
        base_price: 650,
        delivery_time: "5 Days",
        media: [
          { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["React", "Next.js", "Tailwind", "Mobile"],
        is_active: true,
        is_archived: false,
        views_count: 142,
        saves_count: 24,
        orders_count: 8
      },
      {
        id: "mock-s2",
        owner_id: "demo-hustler-id",
        title: "Hype Motion Graphics & Loops",
        description: "3D modeling, fluid simulation loops, and dynamic kinetic typography for overlays and stream screens.",
        category: "Creative",
        pricing_type: "hourly",
        base_price: 90,
        delivery_time: "3 Days",
        media: [
          { url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop", type: "image", metadata: { is_cover: true } }
        ],
        tags: ["Blender", "After Effects", "3D", "Loop"],
        is_active: true,
        is_archived: false,
        views_count: 89,
        saves_count: 15,
        orders_count: 4
      }
    ];

    const now = new Date().toISOString();
    seedData.forEach((item) => {
      const full: ServiceEntity = {
        id: item.id!,
        owner_id: item.owner_id!,
        title: item.title!,
        description: item.description || null,
        category: item.category || null,
        pricing_type: item.pricing_type as any,
        base_price: item.base_price || 0,
        delivery_time: item.delivery_time || null,
        media: item.media || [],
        tags: item.tags || [],
        is_active: item.is_active !== false,
        is_archived: item.is_archived === true,
        availability: item.availability || { appointment_only: false },
        views_count: item.views_count || 0,
        saves_count: item.saves_count || 0,
        orders_count: item.orders_count || 0,
        created_at: now,
        updated_at: now
      };
      this.services.set(full.id, full);
    });
  }

  public findById(id: string): ServiceEntity | null {
    const service = this.services.get(id);
    if (!service || service.is_archived) return null;
    return service;
  }

  public findByOwnerId(ownerId: string): ServiceEntity[] {
    return Array.from(this.services.values()).filter(
      (s) => s.owner_id === ownerId && !s.is_archived
    );
  }

  public findAll(filter?: { activeOnly?: boolean; includeArchived?: boolean }): ServiceEntity[] {
    let list = Array.from(this.services.values());
    if (!filter?.includeArchived) {
      list = list.filter(s => !s.is_archived);
    }
    if (filter?.activeOnly) {
      list = list.filter(s => s.is_active);
    }
    return list;
  }

  public create(service: ServiceEntity): ServiceEntity {
    this.services.set(service.id, service);
    return service;
  }

  public update(id: string, updates: Partial<ServiceEntity>): ServiceEntity | null {
    const service = this.services.get(id);
    if (!service || service.is_archived) return null;

    const updated: ServiceEntity = {
      ...service,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.services.set(id, updated);
    return updated;
  }

  public archive(id: string): ServiceEntity | null {
    const service = this.services.get(id);
    if (!service) return null;

    service.is_archived = true;
    service.is_active = false;
    service.updated_at = new Date().toISOString();
    return service;
  }

  public delete(id: string): boolean {
    return this.services.delete(id);
  }
}

export const serviceRepository = new ServiceRepository();
