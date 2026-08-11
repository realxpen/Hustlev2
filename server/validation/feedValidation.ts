export interface PostActionPayload {
  postId: string;
}

export interface NotInterestedPayload {
  postId: string;
}

export interface FeedQueryPayload {
  page?: number;
  limit?: number;
  category?: string;
  lat?: number;
  lng?: number;
}

export interface PostLikePayload {
  postId: string;
  liked: boolean;
}

export interface PostSavePayload {
  postId: string;
  saved: boolean;
}

export interface PostSharePayload {
  postId: string;
  target?: string;
}

export interface HostFollowPayload {
  targetUserId: string;
  follow: boolean;
}

export function validateFeedQuery(query: any): { error?: string; value: FeedQueryPayload } {
  const page = query.page ? parseInt(query.page as string, 10) : 1;
  const limit = query.limit ? parseInt(query.limit as string, 10) : 10;
  const category = typeof query.category === 'string' ? query.category : undefined;
  
  let lat: number | undefined;
  let lng: number | undefined;

  if (query.lat !== undefined) {
    lat = parseFloat(query.lat as string);
    if (isNaN(lat)) {
      return { error: 'lat must be a valid number', value: { page, limit } };
    }
  }

  if (query.lng !== undefined) {
    lng = parseFloat(query.lng as string);
    if (isNaN(lng)) {
      return { error: 'lng must be a valid number', value: { page, limit } };
    }
  }

  return {
    value: {
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 10 : limit,
      category,
      lat,
      lng
    }
  };
}

export function validatePostAction(body: any): { error?: string; value?: PostActionPayload } {
  if (!body || !body.postId) {
    return { error: 'postId parameter is required in request body' };
  }
  if (typeof body.postId !== 'string') {
    return { error: 'postId must be a valid string' };
  }
  return { value: { postId: body.postId } };
}

export function validateNotInterestedAction(body: any): { error?: string; value?: NotInterestedPayload } {
  if (!body || !body.postId) {
    return { error: 'postId parameter is required in request body' };
  }
  if (typeof body.postId !== 'string') {
    return { error: 'postId must be a valid string' };
  }
  return { value: { postId: body.postId } };
}

export function validatePostLike(body: any): { error?: string; value?: PostLikePayload } {
  if (!body || !body.postId) {
    return { error: 'postId is required' };
  }
  if (typeof body.postId !== 'string') {
    return { error: 'postId must be a valid string' };
  }
  if (body.liked === undefined || typeof body.liked !== 'boolean') {
    return { error: 'liked parameter is required and must be a boolean' };
  }
  return { value: { postId: body.postId, liked: body.liked } };
}

export function validatePostSave(body: any): { error?: string; value?: PostSavePayload } {
  if (!body || !body.postId) {
    return { error: 'postId is required' };
  }
  if (typeof body.postId !== 'string') {
    return { error: 'postId must be a valid string' };
  }
  if (body.saved === undefined || typeof body.saved !== 'boolean') {
    return { error: 'saved parameter is required and must be a boolean' };
  }
  return { value: { postId: body.postId, saved: body.saved } };
}

export function validatePostShare(body: any): { error?: string; value?: PostSharePayload } {
  if (!body || !body.postId) {
    return { error: 'postId is required' };
  }
  if (typeof body.postId !== 'string') {
    return { error: 'postId must be a valid string' };
  }
  return { value: { postId: body.postId, target: body.target } };
}

export function validateHostFollow(body: any): { error?: string; value?: HostFollowPayload } {
  if (!body || !body.targetUserId) {
    return { error: 'targetUserId is required' };
  }
  if (typeof body.targetUserId !== 'string') {
    return { error: 'targetUserId must be a valid string' };
  }
  if (body.follow === undefined || typeof body.follow !== 'boolean') {
    return { error: 'follow parameter is required and must be a boolean' };
  }
  return { value: { targetUserId: body.targetUserId, follow: body.follow } };
}
