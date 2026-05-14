import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeHashtags } from "../utils/hashtags.js";
import { buildPostSelect, serializePost } from "../utils/postQueries.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { publishFeedEvent } from "../sockets/publisher.js";
import { collectionService } from "./collection.service.js";
import {
  getPostInteractionSnapshot,
  getVisiblePostOrThrow,
  refreshPostRankingScore,
  resolveRepostSourceId,
} from "./post.common.js";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function updateCollectionCoverImage(tx, collectionId, postId) {
  const collection = await tx.collection.findUnique({
    where: { id: collectionId },
    select: { coverImageUrl: true },
  });

  if (!collection || collection.coverImageUrl) {
    return;
  }

  const postMedia = await tx.postMedia.findFirst({
    where: { postId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      thumbnailUrl: true,
      url: true,
    },
  });

  if (!postMedia) {
    return;
  }

  await tx.collection.update({
    where: { id: collectionId },
    data: {
      coverImageUrl: postMedia.thumbnailUrl || postMedia.url,
    },
  });
}

export const engagementService = {
  async likePost(postId, userId) {
    await getVisiblePostOrThrow(postId, userId, { id: true });

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!existingLike) {
      await prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            postId,
            userId,
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: { increment: 1 },
          },
        });

        await refreshPostRankingScore(tx, postId);
      });

      publishFeedEvent(SOCKET_EVENTS.postLiked, {
        postId,
        actorId: userId,
        action: "liked",
      });
    }

    return getPostInteractionSnapshot(postId, userId);
  },

  async unlikePost(postId, userId) {
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      select: { id: true },
    });

    if (existingLike) {
      await prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: { decrement: 1 },
          },
        });

        await refreshPostRankingScore(tx, postId);
      });

      publishFeedEvent(SOCKET_EVENTS.postLiked, {
        postId,
        actorId: userId,
        action: "unliked",
      });
    }

    return getPostInteractionSnapshot(postId, userId);
  },

  async repostPost(postId, userId, payload) {
    const targetPost = await getVisiblePostOrThrow(postId, userId, {
      id: true,
      repostOfId: true,
      type: true,
    });

    const originalPostId = resolveRepostSourceId(targetPost);
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_originalPostId: {
          userId,
          originalPostId,
        },
      },
      select: {
        repostPostId: true,
      },
    });

    if (existingRepost) {
      throw new ApiError(409, "You have already reposted this content.");
    }

    const caption = normalizeOptionalString(payload.caption);
    const hashtags = normalizeHashtags([], caption || "");

    const repostPost = await prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          authorId: userId,
          type: "text",
          visibility: payload.visibility,
          caption,
          hashtags,
          repostOfId: originalPostId,
          mediaCount: 0,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      await tx.repost.create({
        data: {
          userId,
          originalPostId,
          repostPostId: createdPost.id,
          caption,
        },
      });

      await tx.post.update({
        where: { id: originalPostId },
        data: {
          repostCount: { increment: 1 },
        },
      });

      await refreshPostRankingScore(tx, originalPostId);

      return tx.post.findUnique({
        where: { id: createdPost.id },
        select: buildPostSelect(userId),
      });
    });

    publishFeedEvent(SOCKET_EVENTS.postReposted, {
      postId: originalPostId,
      repostPostId: repostPost.id,
      actorId: userId,
      action: "reposted",
    });

    return {
      repostPost: serializePost(repostPost),
      originalPost: await getPostInteractionSnapshot(originalPostId, userId),
    };
  },

  async undoRepost(postId, userId) {
    const targetPost = await getVisiblePostOrThrow(postId, userId, {
      id: true,
      repostOfId: true,
    });

    const originalPostId = resolveRepostSourceId(targetPost);
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_originalPostId: {
          userId,
          originalPostId,
        },
      },
      select: {
        repostPostId: true,
      },
    });

    if (!existingRepost) {
      return getPostInteractionSnapshot(originalPostId, userId);
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.delete({
        where: { id: existingRepost.repostPostId },
      });

      await tx.post.update({
        where: { id: originalPostId },
        data: {
          repostCount: { decrement: 1 },
        },
      });

      await refreshPostRankingScore(tx, originalPostId);
    });

    publishFeedEvent(SOCKET_EVENTS.postReposted, {
      postId: originalPostId,
      actorId: userId,
      action: "removed",
    });

    return getPostInteractionSnapshot(originalPostId, userId);
  },

  async savePost(postId, userId, payload) {
    await getVisiblePostOrThrow(postId, userId, { id: true });

    const collection = payload.collectionId
      ? await collectionService.getOwnedCollectionOrThrow(userId, payload.collectionId)
      : await collectionService.getOrCreateDefaultCollection(userId);

    const existingSaveInCollection = await prisma.savedPost.findUnique({
      where: {
        collectionId_postId: {
          collectionId: collection.id,
          postId,
        },
      },
      select: { id: true },
    });

    if (!existingSaveInCollection) {
      const alreadySavedByUser = await prisma.savedPost.findFirst({
        where: {
          userId,
          postId,
        },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        await tx.savedPost.create({
          data: {
            userId,
            collectionId: collection.id,
            postId,
          },
        });

        if (!alreadySavedByUser) {
          await tx.post.update({
            where: { id: postId },
            data: {
              saveCount: { increment: 1 },
            },
          });

          await refreshPostRankingScore(tx, postId);
        }

        await updateCollectionCoverImage(tx, collection.id, postId);
      });

      publishFeedEvent(SOCKET_EVENTS.postSaved, {
        postId,
        actorId: userId,
        collectionId: collection.id,
        action: "saved",
      });
    }

    return {
      collection: {
        id: collection.id,
        name: collection.name,
      },
      post: await getPostInteractionSnapshot(postId, userId),
    };
  },

  async unsavePost(postId, userId, payload) {
    if (payload.collectionId) {
      await collectionService.getOwnedCollectionOrThrow(userId, payload.collectionId);
    }

    const filter = payload.collectionId
      ? {
          userId,
          postId,
          collectionId: payload.collectionId,
        }
      : {
          userId,
          postId,
        };

    const existingUserSave = await prisma.savedPost.findFirst({
      where: {
        userId,
        postId,
      },
      select: { id: true },
    });

    if (existingUserSave) {
      await prisma.$transaction(async (tx) => {
        const removed = await tx.savedPost.deleteMany({
          where: filter,
        });

        if (!removed.count) {
          return;
        }

        const hasRemainingSave = await tx.savedPost.findFirst({
          where: {
            userId,
            postId,
          },
          select: { id: true },
        });

        if (!hasRemainingSave) {
          await tx.post.update({
            where: { id: postId },
            data: {
              saveCount: { decrement: 1 },
            },
          });

          await refreshPostRankingScore(tx, postId);
        }
      });

      publishFeedEvent(SOCKET_EVENTS.postSaved, {
        postId,
        actorId: userId,
        collectionId: payload.collectionId || null,
        action: "unsaved",
      });
    }

    return getPostInteractionSnapshot(postId, userId);
  },
};
