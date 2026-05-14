import { collectionService } from "../services/collection.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const collectionController = {
  async createCollection(req, res) {
    const payload = req.validated?.body ?? req.body;
    const collection = await collectionService.createCollection(req.user.id, payload);

    sendSuccess(res, {
      statusCode: 201,
      message: "Collection created successfully.",
      data: collection,
    });
  },

  async listCollections(req, res) {
    const collections = await collectionService.listCollections(req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Collections fetched successfully.",
      data: collections,
    });
  },

  async getCollectionPosts(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const query = req.validated?.query ?? req.query;
    const result = await collectionService.getCollectionPosts(req.user.id, id, query);

    sendSuccess(res, {
      statusCode: 200,
      message: "Collection posts fetched successfully.",
      data: result.items,
      meta: {
        collection: result.collection,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  },
};
