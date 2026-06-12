import { UserProfile, ProfileContent, ProfileService, ProfileReview, ProfileVerification } from "../types/profile";

export class ProfileRepository {
  private profiles: Map<string, UserProfile> = new Map();
  private contents: Map<string, ProfileContent[]> = new Map();
  private services: Map<string, ProfileService[]> = new Map();
  private reviews: Map<string, ProfileReview[]> = new Map();
  private verifications: Map<string, ProfileVerification[]> = new Map();

  constructor() {
    this.seedProfiles();
  }

  // Pre-seed database collections for matching feed creators & sandbox
  private seedProfiles() {
    const creatorsSeed = [
      {
        id: "creator-marcus",
        fullName: "Marcus Blades",
        firstName: "Marcus",
        lastName: "Blades",
        username: "marcus_blades",
        bio: "Premium master barber specialized in custom shape-ups, classic tapers, and modern textured fringe styles. Miami vibe director.",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        coverUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1000&auto=format&fit=crop&q=80",
        location: "Miami Beach, FL",
        primarySkill: "Haircut",
        secondarySkills: ["Men's Grooming", "Hot Towel Shave", "Taper Fade"],
        skills: ["Haircut", "Men's Grooming", "Hot Towel Shave", "Taper Fade"],
        yearsOfExperience: 8,
        serviceCategories: ["Grooming", "Personal Care"],
        languages: ["English", "Spanish"],
        ratingAverage: 4.9,
        reviewCount: 142,
        isHustler: true,
        isAgent: false,
        verified: true,
        phone: "+1 (555) 303-4921",
        phoneVerified: true,
        emailVerified: true,
        followersCount: 1240,
        followingCount: 382,
        postsCount: 15,
      },
      {
        id: "creator-alex",
        fullName: "Alex Visuals",
        firstName: "Alex",
        lastName: "Visuals",
        username: "alex_visuals",
        bio: "Cinematographer and colorist. Capturing premium action, automotive, and beach lifestyle narratives. 4K HDR delivery.",
        avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        coverUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1000&auto=format&fit=crop&q=80",
        location: "Miami, FL",
        primarySkill: "Photography",
        secondarySkills: ["Color Grading", "Automotive Video", "Drone Coverage"],
        skills: ["Photography", "Color Grading", "Automotive Video", "Drone Coverage"],
        yearsOfExperience: 5,
        serviceCategories: ["Creative", "Media Production"],
        languages: ["English"],
        ratingAverage: 4.8,
        reviewCount: 88,
        isHustler: true,
        isAgent: false,
        verified: true,
        phone: "+1 (555) 707-1288",
        phoneVerified: true,
        emailVerified: true,
        followersCount: 890,
        followingCount: 215,
        postsCount: 9,
      },
      {
        id: "creator-sophia",
        fullName: "Sophia Swift",
        firstName: "Sophia",
        lastName: "Swift",
        username: "sophia_swift",
        bio: "Lead UI/UX architect and system builder. Helping next-generation startups secure venture funding through beautiful user interfaces.",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        coverUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1000&auto=format&fit=crop&q=80",
        location: "Brickell, FL",
        primarySkill: "Product Design",
        secondarySkills: ["UI/UX Design", "Interactive Prototyping", "Figma Design Systems"],
        skills: ["Product Design", "UI/UX Design", "Interactive Prototyping", "Figma Design Systems"],
        yearsOfExperience: 7,
        serviceCategories: ["Design & Tech", "Consulting"],
        languages: ["English", "French"],
        ratingAverage: 5.0,
        reviewCount: 67,
        isHustler: true,
        isAgent: true,
        agencyName: "Swift UX Agency",
        managedHustlersCount: 4,
        verified: true,
        phone: "+1 (555) 505-1993",
        phoneVerified: true,
        emailVerified: true,
        followersCount: 2310,
        followingCount: 412,
        postsCount: 24,
      }
    ];

    creatorsSeed.forEach((p) => {
      const now = new Date().toISOString();
      const profile: UserProfile = {
        ...p,
        createdAt: now,
        updatedAt: now
      };
      this.profiles.set(profile.id, profile);

      // Seed content posts
      this.contents.set(profile.id, [
        {
          id: `post-${profile.id}-1`,
          profileId: profile.id,
          mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-33107-large.mp4",
          mediaType: "video",
          caption: `${profile.fullName} executing top-tier craftsmanship. High attention to detail index!`,
          category: profile.primarySkill,
          likesCount: 154,
          commentsCount: 28,
          createdAt: now
        }
      ]);

      // Seed service lists
      this.services.set(profile.id, [
        {
          id: `service-${profile.id}-1`,
          profileId: profile.id,
          title: `Elite ${profile.primarySkill} Session`,
          price: 90,
          description: `Custom high-end physical/visual delivery matching professional requirements. Fully secure escrow.`,
          durationMinutes: 60,
          active: true,
          bookingsCount: p.reviewCount,
          createdAt: now
        },
        {
          id: `service-${profile.id}-2`,
          profileId: profile.id,
          title: `Standard Fast Consult`,
          price: 45,
          description: `Preliminary scoping session with technical optimization audit.`,
          durationMinutes: 30,
          active: true,
          bookingsCount: Math.floor(p.reviewCount / 3),
          createdAt: now
        }
      ]);

      // Seed reviews
      this.reviews.set(profile.id, [
        {
          id: `review-${profile.id}-1`,
          profileId: profile.id,
          reviewerId: "user-client-1",
          reviewerName: "John Doe",
          reviewerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
          rating: 5,
          comment: `Absolute genius. Completed the task beyond expectations. Highly recommend!`,
          serviceTitle: `Elite ${profile.primarySkill} Session`,
          createdAt: now
        }
      ]);

      // Seed verification statuses
      this.verifications.set(profile.id, [
        {
          id: `ver-${profile.id}-1`,
          profileId: profile.id,
          documentType: "government_id",
          status: "verified",
          verifiedAt: now,
          details: "Verified via Driver License Auth System"
        },
        {
          id: `ver-${profile.id}-2`,
          profileId: profile.id,
          documentType: "sms_auth",
          status: "verified",
          verifiedAt: now,
          details: `Verified matching mobile identifier ${p.phone}`
        }
      ]);
    });

    // Seed default guest/demo user for instant sandbox rendering
    const demoId = "demo-hustler-id";
    const demoProf: UserProfile = {
      id: demoId,
      fullName: "Demo Hustler",
      firstName: "Demo",
      lastName: "Hustler",
      username: "demo_hustler",
      bio: "Local mechanics, barbers, and tradesmen operator. Focused on building community-level trust indicators.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=60",
      location: "Miami, FL",
      primarySkill: "General Contractor",
      secondarySkills: ["Carpentry", "Consultations", "Emergency Repairs"],
      skills: ["Carpentry", "Consultations", "Emergency Repairs"],
      yearsOfExperience: 10,
      serviceCategories: ["Maintenance", "Construction"],
      languages: ["English", "Spanish"],
      ratingAverage: 5.0,
      reviewCount: 1,
      isHustler: true,
      isAgent: false,
      verified: true,
      phone: "+1 (555) 123-4567",
      phoneVerified: true,
      emailVerified: true,
      followersCount: 120,
      followingCount: 85,
      postsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.profiles.set(demoId, demoProf);
  }

  // Fetch singular profile
  public findById(id: string): UserProfile | undefined {
    return this.profiles.get(id);
  }

  // Fetch user profile by username match
  public findByUsername(username: string): UserProfile | undefined {
    const term = username.toLowerCase().replace("@", "").trim();
    return Array.from(this.profiles.values()).find(
      (p) => p.username.toLowerCase() === term
    );
  }

  // Create or Upsert full profile (separates database mutations cleanly)
  public save(profile: UserProfile): UserProfile {
    profile.updatedAt = new Date().toISOString();
    this.profiles.set(profile.id, profile);
    return profile;
  }

  // Sub-data getters with reliable default/empty fallback safety
  public findContentByProfileId(profileId: string): ProfileContent[] {
    return this.contents.get(profileId) || [];
  }

  public findServicesByProfileId(profileId: string): ProfileService[] {
    return this.services.get(profileId) || [];
  }

  public findReviewsByProfileId(profileId: string): ProfileReview[] {
    return this.reviews.get(profileId) || [];
  }

  public findVerificationsByProfileId(profileId: string): ProfileVerification[] {
    return this.verifications.get(profileId) || [];
  }

  // Custom data adders for future extension support
  public addContent(content: ProfileContent): ProfileContent {
    const list = this.contents.get(content.profileId) || [];
    list.unshift(content);
    this.contents.set(content.profileId, list);
    return content;
  }

  public addService(service: ProfileService): ProfileService {
    const list = this.services.get(service.profileId) || [];
    list.unshift(service);
    this.services.set(service.profileId, list);
    return service;
  }

  public addReview(review: ProfileReview): ProfileReview {
    const list = this.reviews.get(review.profileId) || [];
    list.unshift(review);
    this.reviews.set(review.profileId, list);
    
    // Dynamically recalculate average rating & review count for the profile
    const profile = this.profiles.get(review.profileId);
    if (profile) {
      const allReviews = list;
      const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
      profile.ratingAverage = Math.round((sum / allReviews.length) * 10) / 10;
      profile.reviewCount = allReviews.length;
      this.profiles.set(profile.id, profile);
    }
    return review;
  }

  public updateVerification(profileId: string, type: "government_id" | "sms_auth" | "background_check" | "professional_license", status: "pending" | "verified" | "rejected" | "none", details?: string): ProfileVerification {
    const list = this.verifications.get(profileId) || [];
    let ver = list.find(v => v.documentType === type);
    if (!ver) {
      ver = {
        id: `ver-${profileId}-${type}`,
        profileId,
        documentType: type,
        status: status,
        verifiedAt: status === "verified" ? new Date().toISOString() : undefined,
        details
      };
      list.push(ver);
    } else {
      ver.status = status;
      ver.verifiedAt = status === "verified" ? new Date().toISOString() : undefined;
      if (details) ver.details = details;
    }
    this.verifications.set(profileId, list);
    return ver;
  }
}

export const profileRepository = new ProfileRepository();
