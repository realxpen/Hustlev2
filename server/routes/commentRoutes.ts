import { Router } from "express";
import { commentController } from "../controllers/commentController";
import { extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// POST /comment
router.post("/comment", extractPassiveUser, (req, res) =>
  commentController.createComment(req, res),
);

// POST /reply
router.post("/reply", extractPassiveUser, (req, res) =>
  commentController.createReply(req, res),
);

// PUT /comment
router.put("/comment", extractPassiveUser, (req, res) =>
  commentController.updateComment(req, res),
);

// DELETE /comment
router.delete("/comment", extractPassiveUser, (req, res) =>
  commentController.deleteComment(req, res),
);

// GET /content/:id/comments
router.get("/content/:id/comments", extractPassiveUser, (req, res) =>
  commentController.getComments(req, res),
);

export default router;
