import { prisma } from "../prisma/client.js";
import { buildNextCursor, decodeCursor } from "../utils/cursor.js";
import { buildPostSelect, buildVisiblePostFilter, serializePost } from "../utils/postQueries.js";

function buildLatestCursorFilter(cursor) {
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

function buildRecommendedCursorFilter(cursor) {
  if (!cursor) {
    return {};
  }

  const createdAt = new Date(cursor.createdAt);
  const rankingScore = Number(cursor.rankingScore);

  return {
    OR: [
      { rankingScore: { lt: rankingScore } },
      {
        rankingScore,
        createdAt: { lt: createdAt },
      },
      {
        rankingScore,
        createdAt,
        id: { lt: cursor.id },
      },
    ],
  };
}

export const feedService = {
  async getFeed(viewerId, query) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const isRecommended = query.mode === "recommended";
    const cursorFilter = isRecommended
      ? buildRecommendedCursorFilter(cursor)
      : buildLatestCursorFilter(cursor);

    const orderBy = isRecommended
      ? [{ rankingScore: "desc" }, { createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "desc" }, { id: "desc" }];

    const posts = await prisma.post.findMany({
      where: {
        AND: [buildVisiblePostFilter(viewerId), cursorFilter],
      },
      orderBy,
      take: query.limit + 1,
      select: buildPostSelect(viewerId),
    });

    const hasMore = posts.length > query.limit;
    const items = hasMore ? posts.slice(0, query.limit) : posts;

    return {
      items: items.map(serializePost),
      nextCursor: hasMore
        ? buildNextCursor(items, (post) =>
            isRecommended
              ? {
                  mode: query.mode,
                  id: post.id,
                  rankingScore: post.rankingScore,
                  createdAt: post.createdAt.toISOString(),
                }
              : {
                  mode: query.mode,
                  id: post.id,
                  createdAt: post.createdAt.toISOString(),
                },
          )
        : null,
      hasMore,
      mode: query.mode,
      availableModes: ["latest", "recommended"],
    };
  },
};
