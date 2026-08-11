export type ContentTypeSupported =
  | "skill_demo"
  | "skill_demonstration"
  | "project_showcase"
  | "before_after"
  | "educational_tip"
  | "customer_testimonial"
  | "service_promotion";

export interface ProcessedMedia {
  id: string;
  url: string;
  type: "video" | "image";
  coverUrl?: string; // thumbnail Url
  durationSeconds?: number;
  metadata?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    encodingTimeMs: number;
    width?: number;
    height?: number;
    compressionRatio?: number;
  };
  createdAt: string;
}

export interface ContentPost {
  id: string;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    active: boolean;
    rating?: number;
    location?: string;
  };
  contentType: ContentTypeSupported;
  title?: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  media: ProcessedMedia[];
  skills: string[];
  hashtags: string[];
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  savesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentComment {
  id: string;
  contentId: string;
  parentId?: string; // If it's a reply
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  text: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type EngagementActionType = 
  | "like"
  | "unlike"
  | "share"
  | "save"
  | "unsave"
  | "not_interested"
  | "report"
  | "follow_creator"
  | "hire_creator";

export interface EngagementPayload {
  action: EngagementActionType;
  reason?: string; // for report
}

export interface DraftContent {
  id: string;
  creatorId: string;
  stepReached: string;
  mediaIds: string[];
  contentType?: ContentTypeSupported;
  skill?: string;
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishContentPayload {
  creatorId?: string; // ID of the posting user/creator
  draftId?: string; // Optional draft ID reference cleanup
  contentType: ContentTypeSupported;
  title?: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  mediaIds: string[]; // reference IDs from processed uploads
  skills: string[]; // skill tags
  hashtags?: string[]; // social tags
}
