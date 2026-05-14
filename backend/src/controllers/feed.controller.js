import { feedService } from "../services/feed.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const feedController = {
  async getFeed(req, res) {
    const query = req.validated?.query ?? req.query;
    const result = await feedService.getFeed(req.user.id, query);

    sendSuccess(res, {
      statusCode: 200,
      message: "Feed fetched successfully.",
      data: result.items,
      meta: {
        mode: result.mode,
        availableModes: result.availableModes,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  },
};
