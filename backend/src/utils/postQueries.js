export const creatorSelect = {
  id: true,
  username: true,
  profilePhoto: true,
  bio: true,
  role: true,
};

export const mediaSelect = {
  id: true,
  mediaType: true,
  url: true,
  publicId: true,
  mimeType: true,
  format: true,
  resourceType: true,
  width: true,
  height: true,
  durationSeconds: true,
  bytes: true,
  thumbnailUrl: true,
  altText: true,
  sortOrder: true,
};

function buildViewerStateSelection(viewerId) {
  return {
    likes: {
      where: { userId: viewerId },
      select: { id: true },
      take: 1,
    },
    savedPosts: {
      where: { userId: viewerId },
      select: { id: true, collectionId: true },
      take: 5,
    },
    repostEntries: {
      where: { userId: viewerId },
      select: { id: true },
      take: 1,
    },
  };
}

function buildOriginalPostSelect(viewerId) {
  return {
    id: true,
    type: true,
    caption: true,
    hashtags: true,
    visibility: true,
    musicTitle: true,
    musicArtist: true,
    musicUrl: true,
    allowComments: true,
    attachmentType: true,
    attachmentId: true,
    attachmentTitle: true,
    attachmentSubtitle: true,
    attachmentThumbnailUrl: true,
    attachmentPriceMinor: true,
    attachmentCurrency: true,
    attachmentMetadata: true,
    likeCount: true,
    commentCount: true,
    repostCount: true,
    saveCount: true,
    mediaCount: true,
    rankingScore: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: creatorSelect,
    },
    media: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: mediaSelect,
    },
    ...buildViewerStateSelection(viewerId),
  };
}

export function buildPostSelect(viewerId) {
  return {
    id: true,
    authorId: true,
    type: true,
    caption: true,
    hashtags: true,
    visibility: true,
    musicTitle: true,
    musicArtist: true,
    musicUrl: true,
    allowComments: true,
    attachmentType: true,
    attachmentId: true,
    attachmentTitle: true,
    attachmentSubtitle: true,
    attachmentThumbnailUrl: true,
    attachmentPriceMinor: true,
    attachmentCurrency: true,
    attachmentMetadata: true,
    repostOfId: true,
    likeCount: true,
    commentCount: true,
    repostCount: true,
    saveCount: true,
    mediaCount: true,
    rankingScore: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: creatorSelect,
    },
    media: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: mediaSelect,
    },
    repostOf: {
      select: buildOriginalPostSelect(viewerId),
    },
    repostRecord: {
      select: {
        id: true,
        originalPostId: true,
        createdAt: true,
      },
    },
    ...buildViewerStateSelection(viewerId),
  };
}

export function buildVisiblePostFilter(viewerId) {
  return {
    isArchived: false,
    OR: [
      { visibility: "public" },
      { visibility: "followers" },
      { authorId: viewerId },
    ],
  };
}

function mapAttachment(post) {
  if (!post.attachmentType) {
    return null;
  }

  return {
    type: post.attachmentType,
    entityId: post.attachmentId,
    title: post.attachmentTitle,
    subtitle: post.attachmentSubtitle,
    thumbnailUrl: post.attachmentThumbnailUrl,
    priceMinor: post.attachmentPriceMinor,
    currency: post.attachmentCurrency,
    metadata: post.attachmentMetadata,
  };
}

function mapCreator(creator) {
  return {
    id: creator.id,
    username: creator.username,
    profilePhoto: creator.profilePhoto,
    bio: creator.bio,
    role: creator.role,
  };
}

function mapMedia(media) {
  return {
    id: media.id,
    type: media.mediaType,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    mimeType: media.mimeType,
    format: media.format,
    resourceType: media.resourceType,
    width: media.width,
    height: media.height,
    durationSeconds: media.durationSeconds,
    bytes: media.bytes,
    altText: media.altText,
    sortOrder: media.sortOrder,
  };
}

function buildViewerState(post, useOriginalRepostState = false) {
  const repostSource = useOriginalRepostState && post.repostOf ? post.repostOf : post;

  return {
    hasLiked: post.likes.length > 0,
    hasSaved: post.savedPosts.length > 0,
    hasReposted: repostSource.repostEntries.length > 0,
    savedCollectionIds: post.savedPosts.map((savedPost) => savedPost.collectionId),
  };
}

export function serializeOriginalPost(post) {
  if (!post) {
    return null;
  }

  return {
    id: post.id,
    type: post.type,
    caption: post.caption,
    hashtags: post.hashtags,
    visibility: post.visibility,
    audio: post.musicTitle || post.musicArtist || post.musicUrl
      ? {
          title: post.musicTitle,
          artist: post.musicArtist,
          url: post.musicUrl,
        }
      : null,
    creator: mapCreator(post.author),
    media: post.media.map(mapMedia),
    counts: {
      likes: post.likeCount,
      comments: post.commentCount,
      reposts: post.repostCount,
      saves: post.saveCount,
    },
    attachedCommerce: mapAttachment(post),
    viewerState: buildViewerState(post),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function serializePost(post) {
  return {
    id: post.id,
    type: post.type,
    caption: post.caption,
    hashtags: post.hashtags,
    visibility: post.visibility,
    allowComments: post.allowComments,
    audio: post.musicTitle || post.musicArtist || post.musicUrl
      ? {
          title: post.musicTitle,
          artist: post.musicArtist,
          url: post.musicUrl,
        }
      : null,
    creator: mapCreator(post.author),
    media: post.media.map(mapMedia),
    counts: {
      likes: post.likeCount,
      comments: post.commentCount,
      reposts: post.repostCount,
      saves: post.saveCount,
    },
    attachedCommerce: mapAttachment(post),
    viewerState: buildViewerState(post, true),
    isRepost: Boolean(post.repostOf),
    originalPost: serializeOriginalPost(post.repostOf),
    rankingScore: post.rankingScore,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export const commentSelect = {
  id: true,
  postId: true,
  parentId: true,
  body: true,
  replyCount: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: creatorSelect,
  },
};

export function serializeComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    body: comment.body,
    replyCount: comment.replyCount,
    creator: mapCreator(comment.user),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies: (comment.replies || []).map((reply) => serializeComment(reply)),
  };
}
