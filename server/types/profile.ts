export interface UserProfile {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  username: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  location: string;
  primarySkill: string;
  secondarySkills: string[];
  
  // Marketplace Identity
  skills?: string[];
  yearsOfExperience?: number;
  serviceCategories?: string[];
  languages?: string[];

  ratingAverage: number;
  reviewCount: number;
  isHustler: boolean;
  isAgent: boolean; // support future agent features
  agencyName?: string; // support future agent features
  managedHustlersCount?: number; // support future agent features

  // Trust Identity
  verified: boolean; // Identity Verified
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;

  // Social Identity
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;

  createdAt: string;
  updatedAt: string;
}

export interface ProfileContent {
  id: string;
  profileId: string;
  mediaUrl: string;
  mediaType: "video" | "image";
  caption: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface ProfileService {
  id: string;
  profileId: string;
  title: string;
  price: number;
  description: string;
  durationMinutes: number;
  active: boolean; // support future hustler features like toggling services
  bookingsCount: number; // metrics
  createdAt: string;
}

export interface ProfileReview {
  id: string;
  profileId: string; // providerId
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  serviceTitle?: string;
  createdAt: string;
}

export interface ProfileVerification {
  id: string;
  profileId: string;
  documentType: "government_id" | "sms_auth" | "background_check" | "professional_license";
  status: "pending" | "verified" | "rejected" | "none";
  verifiedAt?: string;
  details?: string;
}
