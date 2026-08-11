import { serviceRepository } from "../repositories/serviceRepository";
import { profileRepository } from "../repositories/profileRepository";
import { ServiceEntity } from "../types/service";
import { CreateServicePayload, UpdateServicePayload } from "../validation/serviceValidation";
import crypto from "crypto";

export interface ServiceQueryFilters {
  category?: string;
  query?: string;
  priceMin?: number;
  priceMax?: number;
  pricingType?: 'fixed' | 'hourly' | 'custom' | string;
  tags?: string[];
  ownerId?: string;
  locationMode?: 'local' | 'remote' | 'all' | string;
  verifiedOnly?: boolean;
  availableOnly?: boolean;
  ratingMin?: number;
}

export type ServiceSortOption = 'price_asc' | 'price_desc' | 'popularity' | 'newest' | 'rating';

export class ServiceService {

  /**
   * Retrieves all non-archived, active services (ready for public view)
   */
  public listServices(filters?: { category?: string; query?: string }): ServiceEntity[] {
    let services = serviceRepository.findAll({ activeOnly: true, includeArchived: false });

    if (filters?.category) {
      const lowerCat = filters.category.toLowerCase();
      services = services.filter(s => s.category?.toLowerCase() === lowerCat);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      services = services.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.description && s.description.toLowerCase().includes(q)) || 
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return services;
  }

  /**
   * Advanced query engine supporting compound filtration and professional list sorting
   */
  public listServicesExtended(filters: ServiceQueryFilters, sortBy?: ServiceSortOption): any[] {
    let services = serviceRepository.findAll({ activeOnly: true, includeArchived: false });

    // 1. Filter: category mapping (case-insensitive)
    if (filters.category && filters.category.toLowerCase() !== "all") {
      const targetCat = filters.category.toLowerCase();
      services = services.filter(s => s.category?.toLowerCase() === targetCat);
    }

    // 2. Filter: text query (title, description, tags)
    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      services = services.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.description && s.description.toLowerCase().includes(q)) || 
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // 3. Filter: minimum and maximum price threshold boundaries
    if (filters.priceMin !== undefined) {
      services = services.filter(s => s.base_price >= (filters.priceMin ?? 0));
    }
    if (filters.priceMax !== undefined) {
      services = services.filter(s => s.base_price <= (filters.priceMax ?? 1000));
    }

    // 4. Filter: Pricing payment style format
    if (filters.pricingType && filters.pricingType !== "all") {
      const pType = filters.pricingType.toLowerCase();
      services = services.filter(s => s.pricing_type?.toLowerCase() === pType);
    }

    // 5. Filter: Owner profile mapping
    if (filters.ownerId) {
      services = services.filter(s => s.owner_id === filters.ownerId);
    }

    // 6. Filter: tags matching criteria
    if (filters.tags && filters.tags.length > 0) {
      const filterTags = filters.tags.map(t => t.toLowerCase());
      services = services.filter(s => 
        s.tags.some(t => filterTags.includes(t.toLowerCase()))
      );
    }

    // Resolve owner metadata lookup for verification, ratings, and structure
    let resolvedList = services.map(s => {
      const profile = profileRepository.findById(s.owner_id);
      return {
        ...s,
        profiles: profile ? {
          id: profile.id,
          full_name: profile.fullName,
          hustle_name: profile.fullName,
          avatar_url: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
          verified: profile.verified,
          primary_skill: profile.primarySkill,
          rating_average: profile.ratingAverage,
          review_count: profile.reviewCount
        } : {
          id: s.owner_id,
          full_name: "Hustle Partner",
          hustle_name: "Hustle Partner",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.owner_id}`,
          verified: false,
          primary_skill: "Specialist",
          rating_average: 4.9,
          review_count: 5
        }
      };
    });

    // 7. Filter: verification requirement
    if (filters.verifiedOnly) {
      resolvedList = resolvedList.filter(s => s.profiles?.verified === true);
    }

    // 8. Filter: available schedule slots
    if (filters.availableOnly) {
      resolvedList = resolvedList.filter(s => s.is_active && s.availability?.appointment_only !== true);
    }

    // 9. Filter: Minimum review score threshold
    if (filters.ratingMin !== undefined) {
      resolvedList = resolvedList.filter(s => (s.profiles?.rating_average ?? 4.9) >= (filters.ratingMin ?? 0));
    }

    // 10. Execute sort operation
    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          resolvedList.sort((a, b) => a.base_price - b.base_price);
          break;
        case "price_desc":
          resolvedList.sort((a, b) => b.base_price - a.base_price);
          break;
        case "newest":
          resolvedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case "rating":
          resolvedList.sort((a, b) => (b.profiles?.rating_average ?? 0) - (a.profiles?.rating_average ?? 0));
          break;
        case "popularity":
        default:
          resolvedList.sort((a, b) => {
            const weightA = (a.views_count || 0) + (a.orders_count || 0) * 5;
            const weightB = (b.views_count || 0) + (b.orders_count || 0) * 5;
            return weightB - weightA;
          });
          break;
      }
    }

    return resolvedList;
  }

  /**
   * Generates custom service recommendations based on popularity engagement score and matching keywords/categories
   */
  public getRecommendedServices(limit: number = 6, category?: string): any[] {
    const filters: ServiceQueryFilters = {};
    if (category) {
      filters.category = category;
    }

    const allServices = this.listServicesExtended(filters, "popularity");
    return allServices.slice(0, limit);
  }

  /**
   * Fetches a singular service by unique key identifier
   */
  public getServiceById(id: string): ServiceEntity {
    const service = serviceRepository.findById(id);
    if (!service) {
      throw new Error(`Service with ID '${id}' was not found or has been archived`);
    }

    // Increment view counter dynamically to represent engagement
    try {
      serviceRepository.update(id, { views_count: (service.views_count || 0) + 1 });
    } catch (err) {
      // Passive counter tracking failure shouldn't crash the main query
    }

    return service;
  }

  /**
   * Fetch listings belonging to a specific owner profile
   */
  public getServicesByOwnerId(ownerId: string): ServiceEntity[] {
    return serviceRepository.findByOwnerId(ownerId);
  }

  /**
   * Create a new marketplace Service offering
   * Rule: Only approved hustlers or agents can create services.
   */
  public createService(creatorId: string, payload: CreateServicePayload): ServiceEntity {
    // 1. Resolve Creator profile to check credentials
    const creatorProfile = profileRepository.findById(creatorId);

    // Allow creation if the creator profile is an approved hustler, agent, or is explicitly verified
    const isHustler = creatorProfile?.isHustler === true || 
                      creatorProfile?.primarySkill !== undefined || 
                      creatorProfile?.isAgent === true ||
                      creatorProfile?.verified === true;

    if (!isHustler) {
      throw new Error("Only approved Hustlers or registered Agency managers can publish service offerings.");
    }

    // 2. Resolve owner of the service listing (supports delegating to managed hustlers)
    const targetOwnerId = payload.owner_id || creatorId;

    if (targetOwnerId !== creatorId && creatorProfile?.isAgent !== true) {
      throw new Error("Unauthorized delegation. Only agency representatives can list services for other specialists.");
    }

    const now = new Date().toISOString();
    const serviceId = `service-${crypto.randomUUID().substring(0, 8)}`;

    const newService: ServiceEntity = {
      id: serviceId,
      owner_id: targetOwnerId,
      title: payload.title,
      description: payload.description || null,
      category: payload.category || null,
      pricing_type: payload.pricing_type,
      base_price: payload.base_price,
      delivery_time: payload.delivery_time || null,
      media: payload.media || [],
      tags: payload.tags || [],
      is_active: payload.is_active !== false,
      is_archived: false,
      availability: payload.availability || { appointment_only: false },
      views_count: 0,
      saves_count: 0,
      orders_count: 0,
      created_at: now,
      updated_at: now
    };

    return serviceRepository.create(newService);
  }

  /**
   * Update details on an existing service listing
   * Rule: Owner of the service or authorized supervisor only.
   */
  public updateService(updaterId: string, serviceId: string, payload: UpdateServicePayload): ServiceEntity {
    const service = serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error(`Service with ID '${serviceId}' was not found`);
    }

    // Authority verification
    const isOwner = service.owner_id === updaterId;
    const updaterProfile = profileRepository.findById(updaterId);
    const isManagingAgent = updaterProfile?.isAgent === true; // Simplified checking for sandboxing

    if (!isOwner && !isManagingAgent) {
      throw new Error("Action denied. You do not possess editing privileges for this service offering.");
    }

    const filteredUpdates: Partial<ServiceEntity> = {};

    if (payload.title !== undefined) filteredUpdates.title = payload.title;
    if (payload.description !== undefined) filteredUpdates.description = payload.description;
    if (payload.category !== undefined) filteredUpdates.category = payload.category;
    if (payload.pricing_type !== undefined) filteredUpdates.pricing_type = payload.pricing_type;
    if (payload.base_price !== undefined) filteredUpdates.base_price = payload.base_price;
    if (payload.delivery_time !== undefined) filteredUpdates.delivery_time = payload.delivery_time;
    if (payload.media !== undefined) filteredUpdates.media = payload.media;
    if (payload.tags !== undefined) filteredUpdates.tags = payload.tags;
    if (payload.is_active !== undefined) filteredUpdates.is_active = payload.is_active;
    if (payload.availability !== undefined) filteredUpdates.availability = payload.availability;

    const result = serviceRepository.update(serviceId, filteredUpdates);
    if (!result) {
      throw new Error("Failed to process the requested service modifications");
    }

    return result;
  }

  /**
   * Soft-archives a service listing so it is hidden from client marketplace views but preserved historically
   */
  public archiveService(updaterId: string, serviceId: string): ServiceEntity {
    const service = serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error(`Service with ID '${serviceId}' was not found`);
    }

    const isOwner = service.owner_id === updaterId;
    const updaterProfile = profileRepository.findById(updaterId);
    const isManagingAgent = updaterProfile?.isAgent === true;

    if (!isOwner && !isManagingAgent) {
      throw new Error("Action denied. Only owners or agents can archive this listing.");
    }

    const result = serviceRepository.archive(serviceId);
    if (!result) {
      throw new Error("Failed to complete service archiving procedure");
    }

    return result;
  }

  /**
   * Fully deletes a service from the persistent collection
   */
  public deleteService(updaterId: string, serviceId: string): void {
    const service = serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error(`Service with ID '${serviceId}' was not found`);
    }

    const isOwner = service.owner_id === updaterId;
    const updaterProfile = profileRepository.findById(updaterId);
    const isManagingAgent = updaterProfile?.isAgent === true;

    if (!isOwner && !isManagingAgent) {
      throw new Error("Action denied. Only owners or managing agents can remove this listing.");
    }

    const success = serviceRepository.delete(serviceId);
    if (!success) {
      throw new Error("Failed to execute service deletion routine");
    }
  }
}

export const serviceService = new ServiceService();
