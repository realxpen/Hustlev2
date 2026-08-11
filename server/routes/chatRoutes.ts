import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// GET /conversations -> Fetch conversations for user
router.get("/conversations", extractPassiveUser, (req, res) => chatController.getConversations(req, res));

// GET /messages/:conversationId -> Fetch message archives
router.get("/messages/:conversationId", extractPassiveUser, (req, res) => chatController.getMessages(req, res));

// POST /messages/send -> Send message in thread
router.post("/messages/send", extractPassiveUser, (req, res) => chatController.sendMessage(req, res));

// POST /messages/edit -> Edit message with edit window safeguard
router.post("/messages/edit", extractPassiveUser, (req, res) => chatController.editMessage(req, res));

export default router;
