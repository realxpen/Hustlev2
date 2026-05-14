import { engagementService } from "../services/engagement.service.js";
import { postService } from "../services/post.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const postController = {
  async createPost(req, res) {
    const payload = req.validated?.body ?? req.body;
    const post = await postService.createPost(req.user.id, payload, req.files || {});

    sendSuccess(res, {
      statusCode: 201,
      message: "Post created successfully.",
      data: post,
    });
  },

  async getPostById(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const post = await postService.getPostById(id, req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Post fetched successfully.",
      data: post,
    });
  },

  async likePost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const result = await engagementService.likePost(id, req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Post liked successfully.",
      data: result,
    });
  },

  async unlikePost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const result = await engagementService.unlikePost(id, req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Post unliked successfully.",
      data: result,
    });
  },

  async repostPost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const payload = req.validated?.body ?? req.body;
    const result = await engagementService.repostPost(id, req.user.id, payload);

    sendSuccess(res, {
      statusCode: 201,
      message: "Post reposted successfully.",
      data: result,
    });
  },

  async undoRepost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const result = await engagementService.undoRepost(id, req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Repost removed successfully.",
      data: result,
    });
  },

  async savePost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const payload = req.validated?.body ?? req.body;
    const result = await engagementService.savePost(id, req.user.id, payload);

    sendSuccess(res, {
      statusCode: 200,
      message: "Post saved successfully.",
      data: result,
    });
  },

  async unsavePost(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const payload = req.validated?.query ?? req.query;
    const result = await engagementService.unsavePost(id, req.user.id, payload);

    sendSuccess(res, {
      statusCode: 200,
      message: "Post unsaved successfully.",
      data: result,
    });
  },
};
