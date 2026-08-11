import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ProcessedMedia, ContentPost, PublishContentPayload, ContentTypeSupported, DraftContent, ContentComment, EngagementPayload } from "../types/content";
import { profileRepository } from "../repositories/profileRepository";
import { feedService, FeedItem, FeedItemCreator } from "./feedService";

// Clean static asset storage destination
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export class ContentService {
  private tempMediaRegistry: Map<string, ProcessedMedia> = new Map();
  private postsRegistry: Map<string, ContentPost> = new Map();
  private draftsRegistry: Map<string, DraftContent> = new Map();

  constructor() {
    this.ensureUploadsDirectory();
    this.seedInitialPosts();
  }

  private ensureUploadsDirectory() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        console.log(`[CONTENT-SERVICE] Created uploads directory at ${UPLOADS_DIR}`);
      } catch (err) {
        console.error("[CONTENT-SERVICE] Failed to create uploads directory:", err);
      }
    }
  }

  /**
   * Pre-seed posts to keep stateful persistence and mock searches coherent
   */
  private seedInitialPosts() {
    const seedMedia: ProcessedMedia = {
      id: "media-seed-1",
      url: "https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-33107-large.mp4",
      type: "video",
      coverUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80",
      durationSeconds: 32.5,
      createdAt: new Date().toISOString()
    };
    this.tempMediaRegistry.set(seedMedia.id, seedMedia);

    const seedPost: ContentPost = {
      id: "feed-item-1", // Match feedService index-1
      creatorId: "creator-marcus",
      creator: {
        id: "creator-marcus",
        name: "Marcus Blades",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        verified: true,
        active: true
      },
      contentType: "skill_demonstration",
      title: "Cinematic Skin Fade & Scissor Crop Trim",
      description: "Mid skin fade with textured fringe! Clean line up and customized blade work to match natural posture. Weekend bookings open!",
      location: "Miami Beach, FL",
      latitude: 25.7907,
      longitude: -80.1300,
      media: [seedMedia],
      skills: ["Barbering", "Haircut", "Skin Fade"],
      hashtags: ["#barberlife", "#grooming", "#hustlehard"],
      viewsCount: 2400,
      likesCount: 154,
      sharesCount: 12,
      savesCount: 42,
      commentsCount: 28,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    };
    this.postsRegistry.set(seedPost.id, seedPost);
  }

  /**
   * Identifies appropriate high-quality visual thumbnails based on names/skills
   */
  private matchThumbnailImage(originalName: string): string {
    const term = originalName.toLowerCase();
    if (term.includes("barber") || term.includes("hair") || term.includes("fade") || term.includes("trim") || term.includes("shave") || term.includes("cut")) {
      return "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80"; // Barber shop setup
    }
    if (term.includes("plumb") || term.includes("pipe") || term.includes("leak") || term.includes("water") || term.includes("valve")) {
      return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80"; // Plumber repair tools
    }
    if (term.includes("drywall") || term.includes("patch") || term.includes("wall") || term.includes("plaster") || term.includes("hole")) {
      return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"; // Drywall plaster brush texture
    }
    if (term.includes("paint") || term.includes("brush") || term.includes("roller")) {
      return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80"; // Paints palette
    }
    if (term.includes("wood") || term.includes("sand") || term.includes("table") || term.includes("finish") || term.includes("saw")) {
      return "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80"; // Wood tools carpenter workbench
    }
    if (term.includes("clean") || term.includes("dust") || term.includes("carpet") || term.includes("mop") || term.includes("wash")) {
      return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80"; // House cleaning supplies
    }
    if (term.includes("elect") || term.includes("wire") || term.includes("light") || term.includes("circuit") || term.includes("switch")) {
      return "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=600&auto=format&fit=crop&q=80"; // Wires and hardware components
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"; // Standard modern abstract vector gradient
  }

  /**
   * Processes an uploaded video asset (Simulates compression & metadata extraction)
   */
  public async processUploadedVideo(file: Express.Multer.File): Promise<ProcessedMedia> {
    const id = "media-v-" + crypto.randomBytes(8).toString("hex");
    
    // Save to server local files to maintain active static path
    const extension = path.extname(file.originalname) || ".mp4";
    const filename = `${id}${extension}`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    // Write buffer synchronously or asynchronously
    await fs.promises.writeFile(targetPath, file.buffer);
    const hostUrl = `/uploads/${filename}`;

    // Compression Simulation
    // Compress video by approx 70% to resemble high efficiency formats
    const originalSize = file.size;
    const compressedSizeBytes = Math.round(originalSize * 0.28);
    const encodingTimeMs = Math.round(150 + Math.random() * 320); // ms response time simulation

    // Dynamic duration generation (typically between 12 and 48 seconds for story feeds)
    const mockDuration = Math.round((15 + Math.random() * 30) * 10) / 10;

    const metadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: compressedSizeBytes,
      encodingTimeMs,
      width: 1080,
      height: 1920, // 9:16 vertical video optimization
      compressionRatio: 3.57 // ratio multiplier
    };

    const media: ProcessedMedia = {
      id,
      url: hostUrl,
      type: "video",
      coverUrl: this.matchThumbnailImage(file.originalname),
      durationSeconds: mockDuration,
      metadata,
      createdAt: new Date().toISOString()
    };

    this.tempMediaRegistry.set(id, media);
    console.log(`[CONTENT-SERVICE] Video processed completed and registered: ${id}. File: ${filename}`);
    return media;
  }

  /**
   * Processes an uploaded image asset (Resizes, extracts metadata, creates thumbnail reference)
   */
  public async processUploadedImage(file: Express.Multer.File): Promise<ProcessedMedia> {
    const id = "media-img-" + crypto.randomBytes(8).toString("hex");
    
    // Save to disk
    const extension = path.extname(file.originalname) || ".jpg";
    const filename = `${id}${extension}`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(targetPath, file.buffer);
    const hostUrl = `/uploads/${filename}`;

    // Optimization Simulation
    const originalSize = file.size;
    const optimizedSize = Math.round(originalSize * 0.45); // simulate quality compression
    const encodingTimeMs = Math.round(40 + Math.random() * 80);

    const metadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: optimizedSize,
      encodingTimeMs,
      width: 1200,
      height: 800, // Standard display ratio
      compressionRatio: 2.22
    };

    const media: ProcessedMedia = {
      id,
      url: hostUrl,
      type: "image",
      coverUrl: hostUrl, // pointing directly to the uploaded optimized image
      metadata,
      createdAt: new Date().toISOString()
    };

    this.tempMediaRegistry.set(id, media);
    console.log(`[CONTENT-SERVICE] Image processed completed and registered: ${id}. File: ${filename}`);
    return media;
  }

  /**
   * Drafts feature: Auto-save or update an incomplete post
   */
  public createOrUpdateDraft(creatorId: string, payload: Partial<DraftContent>): DraftContent {
    const draftId = payload.id || ("draft-" + crypto.randomBytes(8).toString("hex"));
    const now = new Date().toISOString();

    const existing = this.draftsRegistry.get(draftId);

    const draft: DraftContent = {
      id: draftId,
      creatorId,
      stepReached: payload.stepReached || (existing?.stepReached || "upload"),
      mediaIds: payload.mediaIds || (existing?.mediaIds || []),
      contentType: payload.contentType !== undefined ? payload.contentType : existing?.contentType,
      skill: payload.skill !== undefined ? payload.skill : existing?.skill,
      title: payload.title !== undefined ? payload.title : existing?.title,
      description: payload.description !== undefined ? payload.description : existing?.description,
      price: payload.price !== undefined ? payload.price : existing?.price,
      location: payload.location !== undefined ? payload.location : existing?.location,
      latitude: payload.latitude !== undefined ? payload.latitude : existing?.latitude,
      longitude: payload.longitude !== undefined ? payload.longitude : existing?.longitude,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    this.draftsRegistry.set(draftId, draft);
    console.log(`[CONTENT-SERVICE] Draft auto-saved: ${draftId} for creator ${creatorId} at step ${draft.stepReached}`);
    return draft;
  }

  /**
   * Drafts feature: Retrieve all active drafts for a creator
   */
  public getUserDrafts(creatorId: string): DraftContent[] {
    const userDrafts: DraftContent[] = [];
    for (const draft of this.draftsRegistry.values()) {
      if (draft.creatorId === creatorId) {
        userDrafts.push(draft);
      }
    }
    // Sort by most recently updated
    return userDrafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Drafts feature: Retrieve specific draft
   */
  public getDraft(draftId: string): DraftContent | undefined {
    return this.draftsRegistry.get(draftId);
  }

  /**
   * Combines media descriptors, coordinates, tags, and creator profile to form a public Content post
   */
  public publishContent(payload: PublishContentPayload, defaultCreatorId: string): ContentPost {
    const { contentType, title, description, location, latitude, longitude, mediaIds, skills, hashtags = [] } = payload;

    const creatorId = payload.creatorId || defaultCreatorId;

    // Resolve creator profile object
    const profile = profileRepository.findById(creatorId);
    if (!profile) {
      throw new Error(`Profile not found for creator ID: ${creatorId}`);
    }

    // Resolve processed media files
    const media: ProcessedMedia[] = [];
    for (const fileId of mediaIds) {
      const processed = this.tempMediaRegistry.get(fileId);
      if (!processed) {
        throw new Error(`Processed media resource with ID '${fileId}' does not exist or has expired`);
      }
      media.push(processed);
    }

    if (media.length === 0) {
      throw new Error("Unable to publish content without establishing a valid media reference file first!");
    }

    const postId = "post-" + crypto.randomBytes(8).toString("hex");
    const now = new Date().toISOString();

    const post: ContentPost = {
      id: postId,
      creatorId,
      creator: {
        id: profile.id,
        name: profile.fullName,
        avatar: profile.avatarUrl,
        verified: profile.verified,
        active: true,
        rating: profile.ratingAverage,
        location: profile.location
      },
      contentType,
      title: title || `${profile.primarySkill} Showcase`,
      description,
      location: location || profile.location,
      latitude: latitude !== undefined ? latitude : 25.7617, // fallback to Miami
      longitude: longitude !== undefined ? longitude : -80.1918,
      media,
      skills,
      hashtags,
      viewsCount: 0,
      likesCount: 0,
      sharesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    // 1. Keep ContentService master registry in sync
    this.postsRegistry.set(post.id, post);

    // 2. Add to Creator's public profile list for consistency
    profileRepository.addContent({
      id: post.id,
      profileId: creatorId,
      mediaUrl: media[0].url,
      mediaType: media[0].type,
      caption: description,
      category: skills[0] || profile.primarySkill,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now
    });

    // 3. Connect as active discovery reel item in FeedService
    const mainMedia = media[0];
    const feedItem: FeedItem = {
      id: post.id,
      creator: {
        id: profile.id,
        name: profile.fullName,
        avatar: profile.avatarUrl,
        verified: profile.verified,
        active: true,
        category: skills[0] || profile.primarySkill,
        location: post.location || profile.location,
        rating: profile.ratingAverage,
        jobs: profile.reviewCount,
        trustLevel: Math.max(1, Math.min(5, Math.ceil(profile.ratingAverage - 1))),
        is_hustler: profile.isHustler,
        lat: post.latitude!,
        lng: post.longitude!
      },
      media_url: mainMedia.url,
      media_type: mainMedia.type,
      caption: description,
      category: skills[0] || profile.primarySkill,
      hasMusic: mainMedia.type === "video",
      musicTrack: mainMedia.type === "video" ? `Original Sound - ${profile.fullName}` : undefined,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      saves_count: 0,
      views_count: 0,
      userHasLiked: false,
      userHasSaved: false,
      userHasFollowed: false,
      ctas: [
        { label: "Book Appointment", type: "book", price: 75 },
        { label: "View Portfolio", type: "apply" }
      ],
      created_at: now
    };
    feedService.addFeedItem(feedItem);

    // Clean up draft if publishing from a saved draft
    if ((payload as any).draftId) {
      this.draftsRegistry.delete((payload as any).draftId);
      console.log(`[CONTENT-SERVICE] Cleaned up draft ${(payload as any).draftId} after successful publish`);
    }

    console.log(`[CONTENT-SERVICE] Successfully published post ${postId} for creator ${profile.fullName}`);
    return post;
  }

  /**
   * Retrieves full details of a specific Content post
   */
  public getPostDetails(postId: string): ContentPost | undefined {
    return this.postsRegistry.get(postId);
  }

  /**
   * Deletes a published content post from overall system frameworks
   */
  public deletePost(postId: string): boolean {
    const post = this.postsRegistry.get(postId);
    if (!post) {
      return false;
    }

    // 1. Erase from Content registry
    this.postsRegistry.delete(postId);

    // 2. Erase from search reel Feed Service
    feedService.removeFeedItem(postId);

    // 3. Delete from matching creator lists in profileRepository mapping
    const creatorId = post.creatorId;
    const list = profileRepository.findContentByProfileId(creatorId);
    const updatedList = list.filter(item => item.id !== postId);
    (profileRepository as any).contents.set(creatorId, updatedList);

    console.log(`[CONTENT-SERVICE] Post ${postId} fully deleted and pruned from all collections`);
    return true;
  }
  /**
   * Orchestrates various structural media engagement interactions
   */
  public trackEngagement(contentId: string, userId: string, payload: EngagementPayload): boolean {
    const post = this.postsRegistry.get(contentId);
    if (!post) {
      throw new Error(`Content post ${contentId} does not exist`);
    }

    switch (payload.action) {
      case "like":
        post.likesCount += 1;
        break;
      case "unlike":
        post.likesCount = Math.max(0, post.likesCount - 1);
        break;
      case "share":
        post.sharesCount += 1;
        break;
      case "save":
        post.savesCount += 1;
        break;
      case "unsave":
        post.savesCount = Math.max(0, post.savesCount - 1);
        break;
      case "not_interested":
        // Logic to suppress content for this user locally
        console.log(`[CONTENT-SERVICE] User ${userId} marked post ${contentId} as not interested. Reason: ${payload.reason}`);
        break;
      case "report":
        console.log(`[CONTENT-SERVICE] User ${userId} reported post ${contentId}. Reason: ${payload.reason}`);
        break;
      case "follow_creator":
        console.log(`[CONTENT-SERVICE] User ${userId} followed creator ${post.creatorId} from post ${contentId}`);
        feedService.trackFollow(userId, post.creatorId, true);
        break;
      case "hire_creator":
        console.log(`[CONTENT-SERVICE] User ${userId} initiated hire flow for creator ${post.creatorId} via post ${contentId}`);
        break;
      default:
        throw new Error(`Unknown engagement action ${payload.action}`);
    }

    return true;
  }
}

export const contentService = new ContentService();
