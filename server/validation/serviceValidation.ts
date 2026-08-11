import { ServiceMedia, ServiceAvailability } from "../types/service";

export interface CreateServicePayload {
  title: string;
  description?: string | null;
  category?: string | null;
  pricing_type: 'fixed' | 'hourly' | 'custom';
  base_price: number;
  delivery_time?: string | null;
  media?: ServiceMedia[];
  tags?: string[];
  is_active?: boolean;
  availability?: ServiceAvailability;
  owner_id?: string;
}

export interface UpdateServicePayload {
  title?: string;
  description?: string | null;
  category?: string | null;
  pricing_type?: 'fixed' | 'hourly' | 'custom';
  base_price?: number;
  delivery_time?: string | null;
  media?: ServiceMedia[];
  tags?: string[];
  is_active?: boolean;
  availability?: ServiceAvailability;
  owner_id?: string;
}

export function validateCreateService(body: any): { error?: string; value?: CreateServicePayload } {
  if (!body) {
    return { error: "Request body is required" };
  }

  const value: any = {};

  // Title: required, non-empty
  if (body.title === undefined || typeof body.title !== "string" || body.title.trim().length === 0) {
    return { error: "title is required and must be a non-empty string" };
  }
  value.title = body.title.trim();

  // Description: optional/nullable string
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return { error: "description must be a string or null" };
    }
    value.description = body.description ? body.description.trim() : null;
  } else {
    value.description = null;
  }

  // Category: optional/nullable string
  if (body.category !== undefined) {
    if (body.category !== null && typeof body.category !== "string") {
      return { error: "category must be a string or null" };
    }
    value.category = body.category ? body.category.trim() : null;
  } else {
    value.category = null;
  }

  // Pricing type: required, fixed/hourly/custom
  if (body.pricing_type === undefined) {
    return { error: "pricing_type is required" };
  }
  const allowedPricingTypes = ['fixed', 'hourly', 'custom'];
  if (!allowedPricingTypes.includes(body.pricing_type)) {
    return { error: `pricing_type must be one of: ${allowedPricingTypes.join(", ")}` };
  }
  value.pricing_type = body.pricing_type;

  // Base price: required, positive number
  if (body.base_price === undefined || typeof body.base_price !== "number" || body.base_price < 0) {
    return { error: "base_price is required and must be a non-negative number" };
  }
  value.base_price = body.base_price;

  // Delivery time: optional/nullable string
  if (body.delivery_time !== undefined) {
    if (body.delivery_time !== null && typeof body.delivery_time !== "string") {
      return { error: "delivery_time must be a string or null" };
    }
    value.delivery_time = body.delivery_time ? body.delivery_time.trim() : null;
  } else {
    value.delivery_time = null;
  }

  // Media: optional array of ServiceMedia
  if (body.media !== undefined) {
    if (!Array.isArray(body.media)) {
      return { error: "media must be an array" };
    }
    for (const item of body.media) {
      if (typeof item !== "object" || item === null) {
        return { error: "Each media item must be an object" };
      }
      if (typeof item.url !== "string" || item.url.trim().length === 0) {
        return { error: "Each media item must contain a valid url string" };
      }
      const allowedMediaTypes = ['image', 'video', 'pdf', 'document'];
      if (item.type !== undefined && !allowedMediaTypes.includes(item.type)) {
        return { error: `media item type must be one of: ${allowedMediaTypes.join(", ")}` };
      }
    }
    value.media = body.media;
  } else {
    value.media = [];
  }

  // Tags: optional array of strings
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return { error: "tags must be an array of strings" };
    }
    const allStrings = body.tags.every((t: any) => typeof t === "string");
    if (!allStrings) {
      return { error: "all tag items must be strings" };
    }
    value.tags = body.tags.map((t: string) => t.trim());
  } else {
    value.tags = [];
  }

  // IsActive: optional boolean
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return { error: "is_active must be a boolean" };
    }
    value.is_active = body.is_active;
  } else {
    value.is_active = true;
  }

  // Availability: optional object
  if (body.availability !== undefined) {
    if (typeof body.availability !== "object" || body.availability === null) {
      return { error: "availability must be an object" };
    }
    const availability: ServiceAvailability = {};
    if (body.availability.appointment_only !== undefined) {
      if (typeof body.availability.appointment_only !== "boolean") {
        return { error: "availability.appointment_only must be a boolean" };
      }
      availability.appointment_only = body.availability.appointment_only;
    }
    if (body.availability.custom_preferences !== undefined) {
      if (body.availability.custom_preferences !== null && typeof body.availability.custom_preferences !== "string") {
        return { error: "availability.custom_preferences must be a string or null" };
      }
      availability.custom_preferences = body.availability.custom_preferences || undefined;
    }
    if (body.availability.schedule !== undefined) {
      if (typeof body.availability.schedule !== "object" || body.availability.schedule === null) {
        return { error: "availability.schedule must be an object" };
      }
      availability.schedule = body.availability.schedule;
    }
    value.availability = availability;
  }

  // OwnerID: optional string (usually derived from token, but can be passed by agent delegations)
  if (body.owner_id !== undefined) {
    if (typeof body.owner_id !== "string" || body.owner_id.trim().length === 0) {
      return { error: "owner_id must be a non-empty string" };
    }
    value.owner_id = body.owner_id.trim();
  }

  return { value };
}

export function validateUpdateService(body: any): { error?: string; value?: UpdateServicePayload } {
  if (!body) {
    return { error: "Request body is required" };
  }

  const value: any = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return { error: "title must be a non-empty string" };
    }
    value.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return { error: "description must be a string or null" };
    }
    value.description = body.description ? body.description.trim() : null;
  }

  if (body.category !== undefined) {
    if (body.category !== null && typeof body.category !== "string") {
      return { error: "category must be a string or null" };
    }
    value.category = body.category ? body.category.trim() : null;
  }

  if (body.pricing_type !== undefined) {
    const allowedPricingTypes = ['fixed', 'hourly', 'custom'];
    if (!allowedPricingTypes.includes(body.pricing_type)) {
      return { error: `pricing_type must be one of: ${allowedPricingTypes.join(", ")}` };
    }
    value.pricing_type = body.pricing_type;
  }

  if (body.base_price !== undefined) {
    if (typeof body.base_price !== "number" || body.base_price < 0) {
      return { error: "base_price must be a non-negative number" };
    }
    value.base_price = body.base_price;
  }

  if (body.delivery_time !== undefined) {
    if (body.delivery_time !== null && typeof body.delivery_time !== "string") {
      return { error: "delivery_time must be a string or null" };
    }
    value.delivery_time = body.delivery_time ? body.delivery_time.trim() : null;
  }

  if (body.media !== undefined) {
    if (!Array.isArray(body.media)) {
      return { error: "media must be an array" };
    }
    for (const item of body.media) {
      if (typeof item !== "object" || item === null) {
        return { error: "Each media item must be an object" };
      }
      if (typeof item.url !== "string" || item.url.trim().length === 0) {
        return { error: "Each media item must contain a valid url string" };
      }
      const allowedMediaTypes = ['image', 'video', 'pdf', 'document'];
      if (item.type !== undefined && !allowedMediaTypes.includes(item.type)) {
        return { error: `media item type must be one of: ${allowedMediaTypes.join(", ")}` };
      }
    }
    value.media = body.media;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return { error: "tags must be an array of strings" };
    }
    const allStrings = body.tags.every((t: any) => typeof t === "string");
    if (!allStrings) {
      return { error: "all tag items must be strings" };
    }
    value.tags = body.tags.map((t: string) => t.trim());
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return { error: "is_active must be a boolean" };
    }
    value.is_active = body.is_active;
  }

  if (body.availability !== undefined) {
    if (typeof body.availability !== "object" || body.availability === null) {
      return { error: "availability must be an object" };
    }
    const availability: ServiceAvailability = {};
    if (body.availability.appointment_only !== undefined) {
      if (typeof body.availability.appointment_only !== "boolean") {
        return { error: "availability.appointment_only must be a boolean" };
      }
      availability.appointment_only = body.availability.appointment_only;
    }
    if (body.availability.custom_preferences !== undefined) {
      if (body.availability.custom_preferences !== null && typeof body.availability.custom_preferences !== "string") {
        return { error: "availability.custom_preferences must be a string or null" };
      }
      availability.custom_preferences = body.availability.custom_preferences || undefined;
    }
    if (body.availability.schedule !== undefined) {
      if (typeof body.availability.schedule !== "object" || body.availability.schedule === null) {
        return { error: "availability.schedule must be an object" };
      }
      availability.schedule = body.availability.schedule;
    }
    value.availability = availability;
  }

  if (body.owner_id !== undefined) {
    if (typeof body.owner_id !== "string" || body.owner_id.trim().length === 0) {
      return { error: "owner_id must be a non-empty string" };
    }
    value.owner_id = body.owner_id.trim();
  }

  return { value };
}
