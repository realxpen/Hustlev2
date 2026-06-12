export interface FeedItemCreator {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  active: boolean; // active green dot indicator
  category: string;
  location: string;
  rating: number;
  jobs: number;
  trustLevel: number; // e.g. Level 4
  is_hustler: boolean;
  lat: number;
  lng: number;
}

export interface FeedItemProductCTA {
  label: string;
  type: 'book' | 'buy' | 'apply' | 'ad';
  price?: number;
}

export interface FeedItem {
  id: string;
  creator: FeedItemCreator;
  media_url: string;
  media_type: 'video' | 'image';
  caption: string;
  category: string;
  hasMusic?: boolean;
  musicTrack?: string;
  
  // Engagement
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  views_count: number;
  
  // Interactions tracking per simulated user sessions
  userHasLiked?: boolean;
  userHasSaved?: boolean;
  userHasFollowed?: boolean;

  // Custom CTAs
  ctas: FeedItemProductCTA[];
  
  created_at: string;
}

class FeedService {
  private items: FeedItem[] = [];
  private userFollows: Map<string, Set<string>> = new Map(); // userId -> set of followed creatorIds
  private userNotInterested: Map<string, Set<string>> = new Map(); // userId -> set of postIds

  constructor() {
    this.seedInitialFeed();
  }

  private seedInitialFeed() {
    const creators: FeedItemCreator[] = [
      {
        id: "creator-marcus",
        name: "Marcus Blades",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        verified: true,
        active: true,
        category: "Haircut",
        location: "Miami Beach, FL",
        rating: 4.9,
        jobs: 142,
        trustLevel: 4,
        is_hustler: true,
        lat: 25.7907,
        lng: -80.1300
      },
      {
        id: "creator-alex",
        name: "Alex Visuals",
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        verified: true,
        active: true,
        category: "Photography",
        location: "Miami, FL",
        rating: 4.8,
        jobs: 88,
        trustLevel: 3,
        is_hustler: true,
        lat: 25.7617,
        lng: -80.1918
      },
      {
        id: "creator-dan",
        name: "Dan Leakfinder",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
        verified: false,
        active: false,
        category: "Plumbing",
        location: "Coral Gables, FL",
        rating: 4.7,
        jobs: 215,
        trustLevel: 4,
        is_hustler: true,
        lat: 25.7215,
        lng: -80.2684
      },
      {
        id: "creator-sophia",
        name: "Sophia Swift",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        verified: true,
        active: true,
        category: "Product Design",
        location: "Brickell, FL",
        rating: 5.0,
        jobs: 67,
        trustLevel: 4,
        is_hustler: true,
        lat: 25.7583,
        lng: -80.1931
      },
      {
        id: "creator-elena",
        name: "Elena Sound",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        verified: true,
        active: false,
        category: "Music Lessons",
        location: "Fort Lauderdale, FL",
        rating: 4.9,
        jobs: 54,
        trustLevel: 3,
        is_hustler: true,
        lat: 26.1224,
        lng: -80.1373
      },
      {
        id: "creator-hassan",
        name: "Hassan Fixer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        verified: false,
        active: true,
        category: "Appliance Repair",
        location: "Wynwood, FL",
        rating: 4.6,
        jobs: 110,
        trustLevel: 2,
        is_hustler: true,
        lat: 25.8015,
        lng: -80.1991
      }
    ];

    const captions = [
      "Mid skin fade with textured fringe! Clean line up and customized blade work to match natural posture. Weekend bookings open!",
      "Supercharged grading session on natural-lit Miami benders. DM to lock in cinematic videography shoot for your ride 🎬",
      "Burst pipe recovery in Brickell. Got the basement completely dried up and brand new copper joints installed in under an hour!",
      "Interactive component designs & rapid prototyping. Helping Hustle founders build delightful touch-points. 🚀",
      "Teaching dynamic acoustic fingerstyle chords. Beginners and advanced players are welcome to join our weekly classes! 🎸",
      "Repaired refrigerator compressor with swift replacement parts. Cold food restored immediately. Call for on-demand repair service!"
    ];

    // High quality mobile video loops ideal for TikTok Style autoplay discovery
    const loops = [
      "https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-33107-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-photographer-capturing-photos-of-a-model-on-the-beach-42352-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-plumber-working-on-a-pipe-42416-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-graphic-designer-working-on-a-sketching-tablet-39328-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34102-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-welder-working-with-sparks-flying-all-around-32860-large.mp4"
    ];

    const tracks = [
      "Original Trim Vibes - Marcus Blades",
      "Summer Cine-wave Beats - Alex Visuals",
      "Industrial Pipes Rhythm - Dan Leak",
      "Lo-Fi Design Symphony - Sophia Swift",
      "Acoustic Flow Minor - Elena Studio",
      "Spark Compressor Bass - Hassan Fix"
    ];

    creators.forEach((creator, index) => {
      this.items.push({
        id: `feed-item-${index + 1}`,
        creator,
        media_url: loops[index % loops.length],
        media_type: "video",
        caption: captions[index % captions.length],
        category: creator.category,
        hasMusic: true,
        musicTrack: tracks[index % tracks.length],
        likes_count: Math.floor(Math.random() * 400) + 50,
        comments_count: Math.floor(Math.random() * 80) + 10,
        shares_count: Math.floor(Math.random() * 50) + 5,
        saves_count: Math.floor(Math.random() * 120) + 15,
        views_count: Math.floor(Math.random() * 2500) + 400,
        userHasLiked: false,
        userHasSaved: false,
        userHasFollowed: false,
        ctas: [
          { label: "Book Appointment", type: "book", price: 60 + index * 15 },
          { label: "View Portfolio", type: "apply" }
        ],
        created_at: new Date(Date.now() - index * 3600000 * 4).toISOString()
      });
    });
  }

  /**
   * Calculates Haversine distance in miles between coordinates
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Fetches, Ranks, and Paginates stateful Feed Items
   */
  public getRankedFeed(params: {
    page: number;
    limit: number;
    category?: string;
    lat?: number;
    lng?: number;
    userId?: string;
    feedType?: string;
  }) {
    const { page, limit, category, lat, lng, userId, feedType } = params;

    // Deep copy items to avoid mutations during live session calculation
    let scoredItems = this.items.map(item => {
      const copy = JSON.parse(JSON.stringify(item)) as FeedItem;
      // Inject session follow states
      if (userId) {
        const follows = this.userFollows.get(userId);
        copy.userHasFollowed = follows ? follows.has(copy.creator.id) : false;
      }
      return copy;
    });

    if (userId) {
      const notInterested = this.userNotInterested.get(userId);
      if (notInterested) {
        scoredItems = scoredItems.filter(item => !notInterested.has(item.id));
      }
    }

    if (feedType === 'following' && userId) {
      const follows = this.userFollows.get(userId);
      if (follows) {
        scoredItems = scoredItems.filter(item => follows.has(item.creator.id));
      } else {
        scoredItems = [];
      }
    }

    // specific content filters
    if (feedType === 'learning') {
      scoredItems = scoredItems.filter(item => ['Music Lessons', 'Education', 'Tips', 'Tutorial'].includes(item.category) || item.caption.toLowerCase().includes('teach'));
    }
    if (feedType === 'services') {
      scoredItems = scoredItems.filter(item => ['Haircut', 'Plumbing', 'Appliance Repair', 'Service'].includes(item.category) || item.ctas.some(c => c.type === 'book'));
    }
    if (feedType === 'projects') {
      scoredItems = scoredItems.filter(item => ['Photography', 'Product Design', 'Project'].includes(item.category));
    }
    if (feedType === 'verified') {
      scoredItems = scoredItems.filter(item => item.creator.verified);
    }

    const scoredFeed = scoredItems.map(item => {
      let score = 0;

      // 1. Utility Score (Content Value)
      let utilityScore = 0;
      if (['Music Lessons', 'Education', 'Tips', 'Tutorial'].includes(item.category) || item.caption.toLowerCase().includes('teach')) {
        utilityScore += 300;
      } else if (['Photography', 'Product Design', 'Project'].includes(item.category)) {
         utilityScore += 200;
      } else if (item.ctas.some(c => c.type === 'book')) {
         utilityScore += 150;
      }
      score += utilityScore;

      // 2. Trust Score (Creator Reputation)
      const creator = item.creator;
      const trustScore = (creator.rating * 25) + (creator.verified ? 100 : 0) + (creator.jobs * 0.5);
      score += trustScore * 2.0;

      // 3. Relevance Category Boosting
      if (category) {
        const itemCat = item.category.toLowerCase();
        const searchCat = category.toLowerCase();
        if (itemCat.includes(searchCat) || searchCat.includes(itemCat)) {
          score += 1500; // Major boost for relevant searches
        }
      }

      // 4. Haversine Location Proximity Weighting (Relevance)
      if (lat !== undefined && lng !== undefined) {
        const distance = this.calculateDistance(lat, lng, creator.lat, creator.lng);
        // Distance penalty reduces score incrementally the further the professional operates
        const distancePenalty = distance * 12; 
        score -= distancePenalty;
        
        // Closer than 15 miles receives proximity appreciation points
        if (distance < 15) {
          score += 300;
        }

        if (feedType === 'nearby' && distance > 50) {
           // extreme penalty for nearby feed if it's too far
           score -= 5000;
        }
      } else if (feedType === 'nearby') {
        // default nearby penalty if no location is provided
        score -= 2000; 
      }

      // 5. Engagement Score - Logarithmic scaling to prevent clickbait virality
      const rawEngagement = 
        (item.likes_count * 1.0) + 
        (item.comments_count * 2.0) + 
        (item.saves_count * 3.0) + 
        (item.shares_count * 4.0) + 
        (item.views_count * 0.01);
      const engagementScore = Math.log10(Math.max(1, rawEngagement)) * 50;
      score += engagementScore;

      return {
        item,
        score
      };
    });

    // Sort feed in descending order based on score
    scoredFeed.sort((a, b) => b.score - a.score);

    // Pagination bounds
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRecords = scoredFeed.slice(startIndex, endIndex).map(sf => sf.item);
    const hasMore = endIndex < scoredFeed.length;

    return {
      success: true,
      data: paginatedRecords,
      meta: {
        page,
        limit,
        total: scoredFeed.length,
        hasMore
      }
    };
  }

  // POST /feed/view - Increments views count
  public trackView(postId: string): boolean {
    const item = this.items.find(i => i.id === postId);
    if (item) {
      item.views_count += 1;
      return true;
    }
    return false;
  }

  // POST /feed/not-interested - Marks content to be avoided
  public trackNotInterested(userId: string, postId: string): boolean {
    if (!this.userNotInterested.has(userId)) {
      this.userNotInterested.set(userId, new Set());
    }
    this.userNotInterested.get(userId)!.add(postId);
    return true;
  }

  // POST /feed/like - Toggles like state and counts
  public trackLike(postId: string, liked: boolean): { success: boolean; likes_count: number } {
    const item = this.items.find(i => i.id === postId);
    if (item) {
      item.userHasLiked = liked;
      if (liked) {
        item.likes_count += 1;
      } else {
        item.likes_count = Math.max(0, item.likes_count - 1);
      }
      return { success: true, likes_count: item.likes_count };
    }
    return { success: false, likes_count: 0 };
  }

  // POST /feed/save - Toggles save state and counts
  public trackSave(postId: string, saved: boolean): { success: boolean; saves_count: number } {
    const item = this.items.find(i => i.id === postId);
    if (item) {
      item.userHasSaved = saved;
      if (saved) {
        item.saves_count += 1;
      } else {
        item.saves_count = Math.max(0, item.saves_count - 1);
      }
      return { success: true, saves_count: item.saves_count };
    }
    return { success: false, saves_count: 0 };
  }

  // POST /feed/share - Tracking and incrementing share logs
  public trackShare(postId: string, target?: string): { success: boolean; shares_count: number } {
    const item = this.items.find(i => i.id === postId);
    if (item) {
      item.shares_count += 1;
      console.log(`[ENGAGEMENT-SHARE] Feed item ${postId} shared. Target: ${target || 'clipboard'}. Total shares: ${item.shares_count}`);
      return { success: true, shares_count: item.shares_count };
    }
    return { success: false, shares_count: 0 };
  }

  // POST /feed/follow - Subscribes actor to professional creator
  public trackFollow(userId: string, targetUserId: string, follow: boolean): { success: boolean; followed: boolean } {
    if (!this.userFollows.has(userId)) {
      this.userFollows.set(userId, new Set());
    }
    const follows = this.userFollows.get(userId)!;
    if (follow) {
      follows.add(targetUserId);
    } else {
      follows.delete(targetUserId);
    }
    
    // Also sync creator follow states
    this.items.forEach(item => {
      if (item.creator.id === targetUserId) {
        item.userHasFollowed = follow;
      }
    });

    console.log(`[SOCIAL-FOLLOW] User ${userId} ${follow ? 'subscribed to' : 'unsubscribed from'} Creator ${targetUserId}`);
    return { success: true, followed: follow };
  }

  /**
   * Dynamically inserts a newly published content post into the discovery feed list.
   */
  public addFeedItem(item: FeedItem): void {
    // Unshift to put on top of the discovery queue
    this.items.unshift(item);
    console.log(`[FEED-SERVICE] New item successfully registered in feed list: ${item.id}`);
  }

  /**
   * Removes a content post from the discovery feed.
   */
  public removeFeedItem(itemId: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    const successfullyRemoved = this.items.length < initialLen;
    if (successfullyRemoved) {
      console.log(`[FEED-SERVICE] Feed item ${itemId} deleted successfully`);
    }
    return successfullyRemoved;
  }
}

export const feedService = new FeedService();
