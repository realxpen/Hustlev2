export interface CreateCommentPayload {
  contentId: string;
  text: string;
  mentions?: string[]; // Array of UUIDs
}

export interface CreateReplyPayload {
  commentId: string; // The parent comment ID
  text: string;
  mentions?: string[];
}

export interface UpdateCommentPayload {
  commentId: string;
  text?: string;
  isPinned?: boolean;
}

export function validateCreateComment(body: any): {
  error?: string;
  value?: CreateCommentPayload;
} {
  if (!body || !body.contentId || !body.text) {
    return { error: "contentId and text are required fields" };
  }
  return {
    value: {
      contentId: body.contentId,
      text: body.text,
      mentions: Array.isArray(body.mentions) ? body.mentions : [],
    },
  };
}

export function validateCreateReply(body: any): {
  error?: string;
  value?: CreateReplyPayload;
} {
  if (!body || !body.commentId || !body.text) {
    return { error: "commentId and text are required fields" };
  }
  return {
    value: {
      commentId: body.commentId,
      text: body.text,
      mentions: Array.isArray(body.mentions) ? body.mentions : [],
    },
  };
}

export function validateUpdateComment(body: any): {
  error?: string;
  value?: UpdateCommentPayload;
} {
  if (!body || !body.commentId) {
    return { error: "commentId is required" };
  }
  return {
    value: {
      commentId: body.commentId,
      text: body.text,
      isPinned: typeof body.isPinned === "boolean" ? body.isPinned : undefined,
    },
  };
}
