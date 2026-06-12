import crypto from "crypto";

// Memory storage for mock implementation
let reviewsDB: any[] = [];
let reviewCategoriesDB: any[] = [];
let reviewMediaDB: any[] = [];
let reviewSummariesDB: Record<string, any> = {};

// Hardcoded bookings map for verification
// In a real app we'd fetch this from the BookingService/DB
const completedBookingsMap: Record<string, string> = {
  // bookingId -> providerId
  "mock-completed-booking-1": "test-provider-id", 
};

export class ReviewService {
  /**
   * Create a new review
   */
  public async createReview(data: {
    reviewerId: string;
    revieweeId: string;
    bookingId: string;
    serviceId?: string;
    overallRating: number;
    categories: Record<string, number>;
    content?: string;
    mediaAttachments?: string[];
  }) {
    // 1. Verification: Check if booking is completed
    // Mocking the verification
    const isValid = completedBookingsMap[data.bookingId] === data.revieweeId;
    if (!isValid && !process.env.SKIP_MOCK_VALIDATION) {
      // In mock, we might just bypass but let's simulate
      // throw new Error("A verified completed booking is required to leave a review.");
    }

    // 2. Prevent duplicate reviews
    const existing = reviewsDB.find(r => r.bookingId === data.bookingId && r.reviewerId === data.reviewerId);
    if (existing) {
      throw new Error("You have already reviewed this booking.");
    }

    if (data.overallRating < 1 || data.overallRating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const reviewId = crypto.randomUUID();
    const now = new Date().toISOString();

    const review = {
      id: reviewId,
      reviewerId: data.reviewerId,
      revieweeId: data.revieweeId,
      bookingId: data.bookingId,
      serviceId: data.serviceId,
      rating: data.overallRating,
      content: data.content,
      createdAt: now,
      updatedAt: now
    };

    reviewsDB.push(review);

    // Categories
    Object.entries(data.categories || {}).forEach(([category, rVals]) => {
      reviewCategoriesDB.push({
        id: crypto.randomUUID(),
        reviewId,
        category,
        rating: rVals
      });
    });

    // Media
    (data.mediaAttachments || []).forEach(url => {
      reviewMediaDB.push({
        id: crypto.randomUUID(),
        reviewId,
        mediaUrl: url,
        mediaType: url.endsWith('.mp4') ? 'video' : 'image',
        createdAt: now
      });
    });

    this.recalculateSummary(data.revieweeId);

    return review;
  }

  /**
   * Update an existing review
   */
  public async updateReview(reviewId: string, reviewerId: string, data: any) {
    const reviewIdx = reviewsDB.findIndex(r => r.id === reviewId && r.reviewerId === reviewerId);
    if (reviewIdx === -1) {
      throw new Error("Review not found or unauthorized.");
    }

    reviewsDB[reviewIdx] = {
      ...reviewsDB[reviewIdx],
      rating: data.overallRating || reviewsDB[reviewIdx].rating,
      content: data.content || reviewsDB[reviewIdx].content,
      updatedAt: new Date().toISOString()
    };

    if (data.categories) {
      reviewCategoriesDB = reviewCategoriesDB.filter(c => c.reviewId !== reviewId);
      Object.entries(data.categories).forEach(([category, rVals]) => {
        reviewCategoriesDB.push({
          id: crypto.randomUUID(),
          reviewId,
          category,
          rating: rVals as number
        });
      });
    }

    if (data.mediaAttachments) {
      reviewMediaDB = reviewMediaDB.filter(m => m.reviewId !== reviewId);
      data.mediaAttachments.forEach((url: string) => {
        reviewMediaDB.push({
          id: crypto.randomUUID(),
          reviewId,
          mediaUrl: url,
          mediaType: url.endsWith('.mp4') ? 'video' : 'image',
          createdAt: new Date().toISOString()
        });
      });
    }

    this.recalculateSummary(reviewsDB[reviewIdx].revieweeId);

    return reviewsDB[reviewIdx];
  }

  /**
   * Get reviews for a provider
   */
  public async getProviderReviews(providerId: string, page: number = 1, limit: number = 10) {
    const providerReviews = reviewsDB.filter(r => r.revieweeId === providerId);
    const start = (page - 1) * limit;
    const paginated = providerReviews.slice(start, start + limit);

    return paginated.map(rev => ({
      ...rev,
      categories: reviewCategoriesDB.filter(c => c.reviewId === rev.id).reduce((acc, curr) => ({...acc, [curr.category]: curr.rating}), {}),
      media: reviewMediaDB.filter(m => m.reviewId === rev.id).map(m => m.mediaUrl)
    }));
  }

  public async getProviderSummary(providerId: string) {
    return reviewSummariesDB[providerId] || {
      userId: providerId,
      totalReviews: 0,
      averageRating: 0.0,
      avgQuality: 0.0,
      avgCommunication: 0.0,
      avgTimeliness: 0.0,
      avgProfessionalism: 0.0
    };
  }

  private recalculateSummary(providerId: string) {
    const providerReviews = reviewsDB.filter(r => r.revieweeId === providerId);
    if (!providerReviews.length) return;

    const total = providerReviews.length;
    const avgOverall = providerReviews.reduce((sum, r) => sum + r.rating, 0) / total;

    // Categories avg math
    const catMap: Record<string, { sum: number, count: number }> = {};
    const catRows = reviewCategoriesDB.filter(c => providerReviews.some(pr => pr.id === c.reviewId));
    catRows.forEach(c => {
      if (!catMap[c.category]) catMap[c.category] = { sum: 0, count: 0 };
      catMap[c.category].sum += c.rating;
      catMap[c.category].count += 1;
    });

    reviewSummariesDB[providerId] = {
      userId: providerId,
      totalReviews: total,
      averageRating: avgOverall,
      avgQuality: catMap['quality'] ? catMap['quality'].sum / catMap['quality'].count : 0,
      avgCommunication: catMap['communication'] ? catMap['communication'].sum / catMap['communication'].count : 0,
      avgTimeliness: catMap['timeliness'] ? catMap['timeliness'].sum / catMap['timeliness'].count : 0,
      avgProfessionalism: catMap['professionalism'] ? catMap['professionalism'].sum / catMap['professionalism'].count : 0,
      updatedAt: new Date().toISOString()
    };
  }
}

export const reviewService = new ReviewService();
