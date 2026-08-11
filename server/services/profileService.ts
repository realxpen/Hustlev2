import { profileRepository } from "../repositories/profileRepository";
import { UserProfile, ProfileContent, ProfileService as ProfileServiceType, ProfileReview, ProfileVerification } from "../types/profile";
import { ProfileUpdatePayload } from "../validation/profileValidation";

export interface OptimallyLoadedProfile extends UserProfile {
  content?: ProfileContent[];
  services?: ProfileServiceType[];
  reviews?: ProfileReview[];
  verifications?: ProfileVerification[];
}

export class ProfileService {
  
  /**
   * Fetches profile by ID
   * @param id The unique profile (and authenticated user) ID
   * @param eagerOptions Optional configurations to bundle multi-relation sub-queries in a single call to optimize performance.
   */
  public getProfileById(
    id: string,
    eagerOptions?: { content?: boolean; services?: boolean; reviews?: boolean; verifications?: boolean }
  ): OptimallyLoadedProfile {
    const rawProfile = profileRepository.findById(id);
    if (!rawProfile) {
      throw new Error(`Profile with identifier '${id}' was not found`);
    }

    const loadedProfile: OptimallyLoadedProfile = { ...rawProfile };

    // Optimize Loading: Fetch relational attributes immediately if requested, bypassing multiple REST calls
    if (eagerOptions?.content) {
      loadedProfile.content = profileRepository.findContentByProfileId(id);
    }
    if (eagerOptions?.services) {
      loadedProfile.services = profileRepository.findServicesByProfileId(id);
    }
    if (eagerOptions?.reviews) {
      loadedProfile.reviews = profileRepository.findReviewsByProfileId(id);
    }
    if (eagerOptions?.verifications) {
      loadedProfile.verifications = profileRepository.findVerificationsByProfileId(id);
    }

    return loadedProfile;
  }

  /**
   * Fetches profile by public screen username
   */
  public getProfileByUsername(
    username: string,
    eagerOptions?: { content?: boolean; services?: boolean; reviews?: boolean; verifications?: boolean }
  ): OptimallyLoadedProfile {
    const rawProfile = profileRepository.findByUsername(username);
    if (!rawProfile) {
      throw new Error(`Profile with username '@${username}' was not found`);
    }

    return this.getProfileById(rawProfile.id, eagerOptions);
  }

  /**
   * Creates a brand new secondary Profile entity (completely separating profile metadata from auth credential data)
   */
  public createProfile(id: string, payload: { fullName: string; username?: string; email?: string }): UserProfile {
    const existing = profileRepository.findById(id);
    if (existing) {
      throw new Error(`A user profile already exists with ID '${id}'`);
    }

    const createdUsername = payload.username || `user_${id.substring(0, 8)}`;
    const now = new Date().toISOString();

    const names = payload.fullName.trim().split(/\s+/);
    const firstName = names[0] || "New";
    const lastName = names.slice(1).join(" ") || "Member";

    const newProfile: UserProfile = {
      id,
      fullName: payload.fullName,
      firstName,
      lastName,
      username: createdUsername.toLowerCase(),
      bio: "Welcome to my Hustle profile!",
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.fullName)}`,
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=60",
      location: "Miami, FL",
      primarySkill: "Hustler",
      secondarySkills: [],
      skills: [],
      yearsOfExperience: 0,
      serviceCategories: [],
      languages: ["English"],
      ratingAverage: 5.0,
      reviewCount: 0,
      isHustler: false,
      isAgent: false,
      verified: false,
      phoneVerified: false,
      emailVerified: !!payload.email,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    return profileRepository.save(newProfile);
  }

  /**
   * Updates an existing profile record
   */
  public updateProfile(id: string, payload: ProfileUpdatePayload): UserProfile {
    const profile = profileRepository.findById(id);
    if (!profile) {
      // Lazy initialize profile if authenticated user tries to update without prior profile set up
      return this.createProfile(id, {
        fullName: payload.fullName || "New Member",
        username: payload.username
      });
    }

    // Apply partial updates safely
    if (payload.fullName !== undefined) {
      profile.fullName = payload.fullName;
      const names = payload.fullName.trim().split(/\s+/);
      profile.firstName = names[0] || "New";
      profile.lastName = names.slice(1).join(" ") || "Member";
    }
    if (payload.firstName !== undefined) profile.firstName = payload.firstName;
    if (payload.lastName !== undefined) profile.lastName = payload.lastName;
    if (payload.username !== undefined) profile.username = payload.username.toLowerCase();
    if (payload.bio !== undefined) profile.bio = payload.bio;
    if (payload.avatarUrl !== undefined) profile.avatarUrl = payload.avatarUrl;
    if (payload.coverUrl !== undefined) profile.coverUrl = payload.coverUrl;
    if (payload.location !== undefined) profile.location = payload.location;
    if (payload.primarySkill !== undefined) profile.primarySkill = payload.primarySkill;
    if (payload.secondarySkills !== undefined) profile.secondarySkills = payload.secondarySkills;
    if (payload.isHustler !== undefined) profile.isHustler = payload.isHustler;
    if (payload.isAgent !== undefined) profile.isAgent = payload.isAgent;
    if (payload.agencyName !== undefined) profile.agencyName = payload.agencyName;
    if (payload.phone !== undefined) profile.phone = payload.phone;
    if (payload.phoneVerified !== undefined) profile.phoneVerified = payload.phoneVerified;
    if (payload.emailVerified !== undefined) profile.emailVerified = payload.emailVerified;
    if (payload.verified !== undefined) profile.verified = payload.verified;

    // Marketplace Identity mapping
    if (payload.skills !== undefined) profile.skills = payload.skills;
    if (payload.yearsOfExperience !== undefined) profile.yearsOfExperience = payload.yearsOfExperience;
    if (payload.serviceCategories !== undefined) profile.serviceCategories = payload.serviceCategories;
    if (payload.languages !== undefined) profile.languages = payload.languages;

    // Social Identity mapping
    if (payload.followersCount !== undefined) profile.followersCount = payload.followersCount;
    if (payload.followingCount !== undefined) profile.followingCount = payload.followingCount;
    if (payload.postsCount !== undefined) profile.postsCount = payload.postsCount;

    return profileRepository.save(profile);
  }

  // --- Sub-Module Sub-relation Getters ---

  public getProfileContent(profileId: string): ProfileContent[] {
    return profileRepository.findContentByProfileId(profileId);
  }

  public getProfileServices(profileId: string): ProfileServiceType[] {
    return profileRepository.findServicesByProfileId(profileId);
  }

  public getProfileReviews(profileId: string): ProfileReview[] {
    return profileRepository.findReviewsByProfileId(profileId);
  }

  public getProfileVerifications(profileId: string): ProfileVerification[] {
    return profileRepository.findVerificationsByProfileId(profileId);
  }
}

export const profileService = new ProfileService();
