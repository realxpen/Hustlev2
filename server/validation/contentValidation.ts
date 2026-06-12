import { PublishContentPayload, ContentTypeSupported } from "../types/content";

const VALID_CONTENT_TYPES: ContentTypeSupported[] = [
  "skill_demo",
  "skill_demonstration",
  "project_showcase",
  "before_after",
  "educational_tip",
  "customer_testimonial",
  "service_promotion"
];

export function validatePublishContent(body: any): { error?: string; value?: PublishContentPayload } {
  if (!body) {
    return { error: "Publish body cannot be empty" };
  }

  const value: PublishContentPayload = {
    contentType: body.contentType,
    description: body.description,
    mediaIds: body.mediaIds,
    skills: body.skills
  };

  // 1. Validate Creator ID
  if (body.creatorId !== undefined) {
    if (typeof body.creatorId !== "string" || body.creatorId.trim().length === 0) {
      return { error: "creatorId must be a non-empty string reference" };
    }
    value.creatorId = body.creatorId.trim();
  }

  // 1B. Validate draft reference
  if (body.draftId !== undefined) {
    if (typeof body.draftId !== "string" || body.draftId.trim().length === 0) {
      return { error: "draftId must be a non-empty string" };
    }
    value.draftId = body.draftId.trim();
  }

  // 2. Validate Content Type
  if (!body.contentType) {
    return { error: "contentType is required" };
  }
  if (!VALID_CONTENT_TYPES.includes(body.contentType)) {
    return { 
      error: `Invalid contentType '${body.contentType}'. Supported values are: ${VALID_CONTENT_TYPES.join(", ")}` 
    };
  }

  // 3. Validate Title (optional)
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return { error: "title must be a non-empty string" };
    }
    value.title = body.title.trim();
  }

  // 4. Validate Description
  if (!body.description) {
    return { error: "description caption is mandatory" };
  }
  if (typeof body.description !== "string" || body.description.trim().length === 0) {
    return { error: "description must be a valid non-empty string value" };
  }
  value.description = body.description.trim();

  // 5. Validate Location & Coordinates (optional)
  if (body.location !== undefined) {
    if (typeof body.location !== "string") {
      return { error: "location must represent a text string" };
    }
    value.location = body.location.trim();
  }

  if (body.latitude !== undefined) {
    if (typeof body.latitude !== "number" || isNaN(body.latitude) || body.latitude < -90 || body.latitude > 90) {
      return { error: "latitude must be a valid number between -90 and 90" };
    }
    value.latitude = body.latitude;
  }

  if (body.longitude !== undefined) {
    if (typeof body.longitude !== "number" || isNaN(body.longitude) || body.longitude < -180 || body.longitude > 180) {
      return { error: "longitude must be a valid number between -180 and 180" };
    }
    value.longitude = body.longitude;
  }

  // 6. Validate Media Reference Array
  if (!body.mediaIds) {
    return { error: "mediaIds references array is required" };
  }
  if (!Array.isArray(body.mediaIds)) {
    return { error: "mediaIds must be a valid array list of processed media tokens" };
  }
  if (body.mediaIds.length === 0) {
    return { error: "At least one processed media ID reference must be specified" };
  }
  const validMediaIds = body.mediaIds.every(id => typeof id === "string" && id.trim().length > 0);
  if (!validMediaIds) {
    return { error: "All mediaIds must be valid non-empty string identifiers" };
  }
  value.mediaIds = body.mediaIds.map(id => id.trim());

  // 7. Validate Skill Tags
  if (!body.skills) {
    return { error: "skills tag array is required" };
  }
  if (!Array.isArray(body.skills)) {
    return { error: "skills must be an array list of string skill indicators" };
  }
  if (body.skills.length === 0) {
    return { error: "At least one skill tag must be attached to publish content" };
  }
  const validSkills = body.skills.every(skill => typeof skill === "string" && skill.trim().length > 0);
  if (!validSkills) {
    return { error: "All skills must be valid text string labels" };
  }
  value.skills = body.skills.map(skill => skill.trim());

  // 8. Validate Hashtags (optional)
  if (body.hashtags !== undefined) {
    if (!Array.isArray(body.hashtags)) {
      return { error: "hashtags must represent an array of strings" };
    }
    const validHashtags = body.hashtags.every(tag => typeof tag === "string" && tag.trim().length > 0);
    if (!validHashtags) {
      return { error: "All hashtag items must be valid strings" };
    }
    value.hashtags = body.hashtags.map(tag => {
      const clean = tag.trim();
      return clean.startsWith("#") ? clean : `#${clean}`;
    });
  }

  return { value };
}
