import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { calculateRankingScore } from "../utils/feedScore.js";
import { buildPostSelect, buildVisiblePostFilter } from "../utils/postQueries.js";

export async function getVisiblePostOrThrow(postId, viewerId, select = buildPostSelect(viewerId)) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      ...buildVisiblePostFilter(viewerId),
    },
    select,
  });

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  return post;
}

export function resolveRepostSourceId(post) {
  return post.repostOfId || post.id;
}

export async function refreshPostRankingScore(tx, postId) {
  const post = await tx.post.findUnique({
    where: { id: postId },
    select: {
      likeCount: true,
      commentCount: true,
      repostCount: true,
      saveCount: true,
    },
  });

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  return tx.post.update({
    where: { id: postId },
    data: {
      rankingScore: calculateRankingScore(post),
    },
    select: {
      id: true,
      likeCount: true,
      commentCount: true,
      repostCount: true,
      saveCount: true,
      rankingScore: true,
    },
  });
}

export async function getPostInteractionSnapshot(postId, viewerId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      likeCount: true,
      commentCount: true,
      repostCount: true,
      saveCount: true,
      likes: {
        where: { userId: viewerId },
        select: { id: true },
        take: 1,
      },
      savedPosts: {
        where: { userId: viewerId },
        select: { id: true, collectionId: true },
        take: 10,
      },
      repostEntries: {
        where: { userId: viewerId },
        select: { id: true },
        take: 1,
      },
      repostOf: {
        select: {
          repostEntries: {
            where: { userId: viewerId },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  return {
    postId: post.id,
    counts: {
      likes: post.likeCount,
      comments: post.commentCount,
      reposts: post.repostCount,
      saves: post.saveCount,
    },
    viewerState: {
      hasLiked: post.likes.length > 0,
      hasSaved: post.savedPosts.length > 0,
      hasReposted: (post.repostOf ? post.repostOf.repostEntries : post.repostEntries).length > 0,
      savedCollectionIds: post.savedPosts.map((savedPost) => savedPost.collectionId),
    },
  };
}
