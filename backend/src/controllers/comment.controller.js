import { commentService } from "../services/comment.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const commentController = {
  async createCommentOnPost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const payload = req.validated?.body ?? req.body;
    const comment = await commentService.createCommentOnPost(id, req.user.id, payload);

    sendSuccess(res, {
      statusCode: 201,
      message: "Comment created successfully.",
      data: comment,
    });
  },

  async replyToComment(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const payload = req.validated?.body ?? req.body;
    const comment = await commentService.replyToComment(id, req.user.id, payload);

    sendSuccess(res, {
      statusCode: 201,
      message: "Reply created successfully.",
      data: comment,
    });
  },

  async listCommentsForPost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const query = req.validated?.query ?? req.query;
    const result = await commentService.listCommentsForPost(id, req.user.id, query);

    sendSuccess(res, {
      statusCode: 200,
      message: "Comments fetched successfully.",
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  },
};
