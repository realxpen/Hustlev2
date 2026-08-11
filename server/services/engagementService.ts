// server/services/engagementService.ts

export class EngagementService {
  // In-memory mock for stores
  // user_id -> set(post_ids)
  private collections: { [type: string]: Map<string, Set<string>> } = {
    likes: new Map(),
    saves: new Map(),
    follows: new Map(),
    shares: new Map(),
    notInterested: new Map(),
    reports: new Map()
  };

  constructor() {}

  private _getSet(type: string, userId: string): Set<string> {
    if (!this.collections[type].has(userId)) {
      this.collections[type].set(userId, new Set());
    }
    return this.collections[type].get(userId)!;
  }

  // Idempotent Like
  public trackLike(userId: string, postId: string): boolean {
    const likes = this._getSet('likes', userId);
    const wasLiked = likes.has(postId);
    likes.add(postId);
    
    if (!wasLiked) {
      this._emitEvent(userId, postId, 'LIKE_ADDED');
      this._triggerRecommendationHook(userId, postId, 1.0);
    }
    return true;
  }

  public removeLike(userId: string, postId: string): boolean {
    const likes = this._getSet('likes', userId);
    const wasLiked = likes.has(postId);
    likes.delete(postId);
    
    if (wasLiked) {
      this._emitEvent(userId, postId, 'LIKE_REMOVED');
      this._triggerRecommendationHook(userId, postId, -1.0);
    }
    return true;
  }

  // Idempotent Save
  public trackSave(userId: string, postId: string): boolean {
    const saves = this._getSet('saves', userId);
    const wasSaved = saves.has(postId);
    saves.add(postId);
    
    if (!wasSaved) {
      this._emitEvent(userId, postId, 'SAVE_ADDED');
      this._triggerRecommendationHook(userId, postId, 2.0); // Save is stronger than like
    }
    return true;
  }

  public removeSave(userId: string, postId: string): boolean {
    const saves = this._getSet('saves', userId);
    const wasSaved = saves.has(postId);
    saves.delete(postId);
    
    if (wasSaved) {
      this._emitEvent(userId, postId, 'SAVE_REMOVED');
      this._triggerRecommendationHook(userId, postId, -2.0);
    }
    return true;
  }

  // Idempotent Follow
  public trackFollow(userId: string, creatorId: string): boolean {
    const follows = this._getSet('follows', userId);
    const wasFollowed = follows.has(creatorId);
    follows.add(creatorId);
    
    if (!wasFollowed) {
      this._emitEvent(userId, creatorId, 'FOLLOW_ADDED');
      // Substantial boost when user explicitly follows
      this._triggerRecommendationHook(userId, creatorId, 5.0, 'user');
    }
    return true;
  }

  public removeFollow(userId: string, creatorId: string): boolean {
    const follows = this._getSet('follows', userId);
    const wasFollowed = follows.has(creatorId);
    follows.delete(creatorId);
    
    if (wasFollowed) {
      this._emitEvent(userId, creatorId, 'FOLLOW_REMOVED');
      this._triggerRecommendationHook(userId, creatorId, -5.0, 'user');
    }
    return true;
  }

  // Shares
  public trackShare(userId: string, postId: string): boolean {
    const shares = this._getSet('shares', userId);
    shares.add(postId); // can share multiple times, but we track
    this._emitEvent(userId, postId, 'SHARE_ADDED');
    this._triggerRecommendationHook(userId, postId, 3.0);
    return true;
  }

  // Not Interested
  public trackNotInterested(userId: string, postId: string): boolean {
    const notInterested = this._getSet('notInterested', userId);
    const wasMarked = notInterested.has(postId);
    notInterested.add(postId);
    
    if (!wasMarked) {
      this._emitEvent(userId, postId, 'NOT_INTERESTED_ADDED');
      // Strong penalty to retrain recommendation weights
      this._triggerRecommendationHook(userId, postId, -10.0);
    }
    return true;
  }

  // Report
  public trackReport(userId: string, targetId: string, targetType: string, reason: string): boolean {
    const reports = this._getSet('reports', userId);
    const reportKey = `${targetType}:${targetId}`;
    const wasReported = reports.has(reportKey);
    reports.add(reportKey);
    
    if (!wasReported) {
      this._emitEvent(userId, targetId, 'REPORT_FILED', { type: targetType, reason });
      this._triggerRecommendationHook(userId, targetId, -20.0, targetType);
    }
    return true;
  }

  // ---
  // Analytics & Recommender Mocks
  // ---
  
  private _emitEvent(userId: string, targetId: string, event: string, metadata: any = {}) {
    // Write directly into analytical events partition (e.g., BigQuery, Kafka, or feed_events table)
    console.log(`[Analytics Engine] USER: ${userId} | TARGET: ${targetId} | EVENT: ${event} | META: ${JSON.stringify(metadata)}`);
  }

  private _triggerRecommendationHook(userId: string, targetId: string, weightShift: number, type: string = 'post') {
    // Notify the ML ranking cluster to adjust the user's embedding vectors
    console.log(`[Recommendation Engine] Hooks Triggered for User ${userId}. Weight shifted by ${weightShift} for ${type} ${targetId}`);
  }
}

export const engagementService = new EngagementService();
