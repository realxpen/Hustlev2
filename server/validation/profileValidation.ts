export interface ProfileUpdatePayload {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  primarySkill?: string;
  secondarySkills?: string[];
  
  // Marketplace Identity
  skills?: string[];
  yearsOfExperience?: number;
  serviceCategories?: string[];
  languages?: string[];

  isHustler?: boolean;
  isAgent?: boolean;
  agencyName?: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  verified?: boolean;

  // Social Identity
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export function validateProfileUpdate(body: any): { error?: string; value?: ProfileUpdatePayload } {
  if (!body) {
    return { error: "Request body cannot be empty" };
  }

  const value: ProfileUpdatePayload = {};

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || body.fullName.trim().length === 0) {
      return { error: "fullName must be a non-empty string" };
    }
    value.fullName = body.fullName.trim();
  }

  if (body.username !== undefined) {
    if (typeof body.username !== "string") {
      return { error: "username must be a string" };
    }
    const cleanUsername = body.username.trim().replace("@", "");
    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      return { error: "username must be between 3 and 25 characters long" };
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return { error: "username can only contain alphanumeric characters and underscores" };
    }
    value.username = cleanUsername;
  }

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") {
      return { error: "bio must be a string value" };
    }
    if (body.bio.length > 1000) {
      return { error: "bio cannot exceed 1000 characters in length" };
    }
    value.bio = body.bio.trim();
  }

  if (body.avatarUrl !== undefined) {
    if (typeof body.avatarUrl !== "string" || !body.avatarUrl.startsWith("http")) {
      return { error: "avatarUrl must be a valid HTTPS absolute URL" };
    }
    value.avatarUrl = body.avatarUrl;
  }

  if (body.coverUrl !== undefined) {
    if (typeof body.coverUrl !== "string" || !body.coverUrl.startsWith("http")) {
      return { error: "coverUrl must be a valid HTTPS absolute URL" };
    }
    value.coverUrl = body.coverUrl;
  }

  if (body.location !== undefined) {
    if (typeof body.location !== "string") {
      return { error: "location must be a valid location string" };
    }
    value.location = body.location.trim();
  }

  if (body.primarySkill !== undefined) {
    if (typeof body.primarySkill !== "string") {
      return { error: "primarySkill must be a string value" };
    }
    value.primarySkill = body.primarySkill.trim();
  }

  if (body.secondarySkills !== undefined) {
    if (!Array.isArray(body.secondarySkills)) {
      return { error: "secondarySkills must represent an array of tag strings" };
    }
    const validTags = body.secondarySkills.every(tag => typeof tag === "string");
    if (!validTags) {
      return { error: "All secondarySkills tags must be valid text strings" };
    }
    value.secondarySkills = body.secondarySkills.map(tag => tag.trim());
  }

  if (body.isHustler !== undefined) {
    if (typeof body.isHustler !== "boolean") {
      return { error: "isHustler must be a boolean indicator" };
    }
    value.isHustler = body.isHustler;
  }

  if (body.isAgent !== undefined) {
    if (typeof body.isAgent !== "boolean") {
      return { error: "isAgent must be a boolean indicator" };
    }
    value.isAgent = body.isAgent;
  }

  if (body.agencyName !== undefined) {
    if (typeof body.agencyName !== "string") {
      return { error: "agencyName must be a string" };
    }
    value.agencyName = body.agencyName.trim();
  }

  if (body.phone !== undefined) {
    if (body.phone !== null && typeof body.phone !== "string") {
      return { error: "phone must be a string or null" };
    }
    value.phone = body.phone ? body.phone.trim() : undefined;
  }

  if (body.phoneVerified !== undefined) {
    if (typeof body.phoneVerified !== "boolean") {
      return { error: "phoneVerified must be a boolean indicator" };
    }
    value.phoneVerified = body.phoneVerified;
  }

  if (body.emailVerified !== undefined) {
    if (typeof body.emailVerified !== "boolean") {
      return { error: "emailVerified must be a boolean indicator" };
    }
    value.emailVerified = body.emailVerified;
  }

  if (body.verified !== undefined) {
    if (typeof body.verified !== "boolean") {
      return { error: "verified status must be a boolean" };
    }
    value.verified = body.verified;
  }

  // Basic Identity
  if (body.firstName !== undefined) {
    if (typeof body.firstName !== "string") {
      return { error: "firstName must be a string value" };
    }
    value.firstName = body.firstName.trim();
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string") {
      return { error: "lastName must be a string value" };
    }
    value.lastName = body.lastName.trim();
  }

  // Marketplace Identity
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills)) {
      return { error: "skills must be an array of strings" };
    }
    value.skills = body.skills.map((s: any) => String(s).trim());
  }

  if (body.yearsOfExperience !== undefined) {
    if (typeof body.yearsOfExperience !== "number" || body.yearsOfExperience < 0) {
      return { error: "yearsOfExperience must be a positive integer" };
    }
    value.yearsOfExperience = body.yearsOfExperience;
  }

  if (body.serviceCategories !== undefined) {
    if (!Array.isArray(body.serviceCategories)) {
      return { error: "serviceCategories must be an array of strings" };
    }
    value.serviceCategories = body.serviceCategories.map((sc: any) => String(sc).trim());
  }

  if (body.languages !== undefined) {
    if (!Array.isArray(body.languages)) {
      return { error: "languages must be an array of strings" };
    }
    value.languages = body.languages.map((l: any) => String(l).trim());
  }

  // Social Identity
  if (body.followersCount !== undefined) {
    if (typeof body.followersCount !== "number" || body.followersCount < 0) {
      return { error: "followersCount must be a positive number" };
    }
    value.followersCount = body.followersCount;
  }

  if (body.followingCount !== undefined) {
    if (typeof body.followingCount !== "number" || body.followingCount < 0) {
      return { error: "followingCount must be a positive number" };
    }
    value.followingCount = body.followingCount;
  }

  if (body.postsCount !== undefined) {
    if (typeof body.postsCount !== "number" || body.postsCount < 0) {
      return { error: "postsCount must be a positive number" };
    }
    value.postsCount = body.postsCount;
  }

  return { value };
}
