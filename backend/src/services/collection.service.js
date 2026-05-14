import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { buildNextCursor, decodeCursor } from "../utils/cursor.js";
import { buildPostSelect, serializePost } from "../utils/postQueries.js";

function serializeCollection(collection) {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    coverImageUrl: collection.coverImageUrl,
    isSystem: collection.isSystem,
    counts: {
      savedPosts: collection._count?.savedPosts ?? 0,
    },
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

export const collectionService = {
  async getOrCreateDefaultCollection(userId) {
    const existingCollection = await prisma.collection.findFirst({
      where: {
        userId,
        isSystem: true,
        name: "Saved",
      },
    });

    if (existingCollection) {
      return existingCollection;
    }

    return prisma.collection.create({
      data: {
        userId,
        name: "Saved",
        description: "Default system collection for saved posts.",
        isSystem: true,
      },
    });
  },

  async createCollection(userId, payload) {
    const collection = await prisma.collection.create({
      data: {
        userId,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            savedPosts: true,
          },
        },
      },
    });

    return serializeCollection(collection);
  },

  async listCollections(userId) {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            savedPosts: true,
          },
        },
      },
    });

    return collections.map(serializeCollection);
  },

  async getOwnedCollectionOrThrow(userId, collectionId) {
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
      throw new ApiError(404, "Collection not found.");
    }

    return collection;
  },

  async getCollectionPosts(userId, collectionId, query) {
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            savedPosts: true,
          },
        },
      },
    });

    if (!collection) {
      throw new ApiError(404, "Collection not found.");
    }

    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const cursorWhere = cursor
      ? {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              createdAt: new Date(cursor.createdAt),
              id: { lt: cursor.id },
            },
          ],
        }
      : {};

    const savedPosts = await prisma.savedPost.findMany({
      where: {
        AND: [{ collectionId }, cursorWhere],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      select: {
        id: true,
        createdAt: true,
        post: {
          select: buildPostSelect(userId),
        },
      },
    });

    const hasMore = savedPosts.length > query.limit;
    const items = hasMore ? savedPosts.slice(0, query.limit) : savedPosts;

    return {
      collection: serializeCollection(collection),
      items: items.map((savedPost) => ({
        savedAt: savedPost.createdAt,
        post: serializePost(savedPost.post),
      })),
      nextCursor: hasMore
        ? buildNextCursor(items, (savedPost) => ({
            id: savedPost.id,
            createdAt: savedPost.createdAt.toISOString(),
          }))
        : null,
      hasMore,
    };
  },
};
