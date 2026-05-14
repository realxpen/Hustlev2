import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { buildNextCursor, decodeCursor } from "../utils/cursor.js";
import { commentSelect, serializeComment } from "../utils/postQueries.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { publishFeedEvent } from "../sockets/publisher.js";
import { getVisiblePostOrThrow, refreshPostRankingScore } from "./post.common.js";

function buildCommentCursorFilter(cursor) {
  if (!cursor) {
    return {};
  }

  const createdAt = new Date(cursor.createdAt);

  return {
    OR: [
      { createdAt: { lt: createdAt } },
      {
        createdAt,
        id: { lt: cursor.id },
      },
    ],
  };
}

async function preventDuplicateCommentSpam({ userId, postId, parentId, body }) {
  const recentComment = await prisma.comment.findFirst({
    where: {
      userId,
      postId,
      parentId,
      body,
      createdAt: {
        gte: new Date(Date.now() - 30 * 1000),
      },
    },
    select: { id: true },
  });

  if (recentComment) {
    throw new ApiError(429, "Please wait before sending the same comment again.");
  }
}

export const commentService = {
  async createCommentOnPost(postId, userId, payload) {
    const post = await getVisiblePostOrThrow(postId, userId, {
      id: true,
      allowComments: true,
    });

    if (!post.allowComments) {
      throw new ApiError(403, "Comments are disabled for this post.");
    }

    const body = payload.body.trim();
    await preventDuplicateCommentSpam({
      userId,
      postId,
      parentId: null,
      body,
    });

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: {
          postId,
          userId,
          body,
        },
        select: {
          ...commentSelect,
          replies: {
            where: { isDeleted: false },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 5,
            select: commentSelect,
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      await refreshPostRankingScore(tx, postId);
      return createdComment;
    });

    publishFeedEvent(SOCKET_EVENTS.postCommented, {
      postId,
      commentId: comment.id,
      actorId: userId,
      parentId: null,
    });

    return serializeComment(comment);
  },

  async replyToComment(commentId, userId, payload) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        postId: true,
        body: true,
        isDeleted: true,
      },
    });

    if (!parentComment || parentComment.isDeleted) {
      throw new ApiError(404, "Parent comment not found.");
    }

    const post = await getVisiblePostOrThrow(parentComment.postId, userId, {
      id: true,
      allowComments: true,
    });

    if (!post.allowComments) {
      throw new ApiError(403, "Comments are disabled for this post.");
    }

    const body = payload.body.trim();
    await preventDuplicateCommentSpam({
      userId,
      postId: parentComment.postId,
      parentId: commentId,
      body,
    });

    const reply = await prisma.$transaction(async (tx) => {
      const createdReply = await tx.comment.create({
        data: {
          postId: parentComment.postId,
          userId,
          parentId: commentId,
          body,
        },
        select: commentSelect,
      });

      await tx.comment.update({
        where: { id: commentId },
        data: {
          replyCount: { increment: 1 },
        },
      });

      await tx.post.update({
        where: { id: parentComment.postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      await refreshPostRankingScore(tx, parentComment.postId);
      return createdReply;
    });

    publishFeedEvent(SOCKET_EVENTS.postCommented, {
      postId: parentComment.postId,
      commentId: reply.id,
      actorId: userId,
      parentId: commentId,
    });

    return serializeComment(reply);
  },

  async listCommentsForPost(postId, userId, query) {
    await getVisiblePostOrThrow(postId, userId, {
      id: true,
    });

    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const comments = await prisma.comment.findMany({
      where: {
        AND: [
          {
            postId,
            parentId: null,
            isDeleted: false,
          },
          buildCommentCursorFilter(cursor),
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      select: {
        ...commentSelect,
        replies: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 5,
          select: commentSelect,
        },
      },
    });

    const hasMore = comments.length > query.limit;
    const items = hasMore ? comments.slice(0, query.limit) : comments;

    return {
      items: items.map(serializeComment),
      nextCursor: hasMore
        ? buildNextCursor(items, (comment) => ({
            id: comment.id,
            createdAt: comment.createdAt.toISOString(),
          }))
        : null,
      hasMore,
    };
  },
};
