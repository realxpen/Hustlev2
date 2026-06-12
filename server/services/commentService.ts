import crypto from "crypto";
import { contentService } from "./contentService";
import { profileRepository } from "../repositories/profileRepository";

export interface CommentNode {
  id: string;
  contentId: string;
  parentId?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    isCreator?: boolean;
  };
  text: string;
  mentions: string[];
  isPinned: boolean;
  isQuestion: boolean;
  isAnswer: boolean;
  likesCount: number;
  repliesCount: number;
  replies?: CommentNode[];
  createdAt: string;
  updatedAt: string;
}

export class CommentService {
  private commentsDb: Map<string, CommentNode> = new Map();

  // POST /comment
  public createComment(
    contentId: string,
    authorId: string,
    text: string,
    mentions: string[],
  ): CommentNode {
    const post = contentService.getPostDetails(contentId);
    if (!post) throw new Error(`Content post ${contentId} does not exist`);

    const profile = profileRepository.findById(authorId);
    if (!profile) throw new Error(`Profile not found for author ${authorId}`);

    const commentId = "comment-" + crypto.randomBytes(8).toString("hex");
    const now = new Date().toISOString();

    // Check if the author is the creator of the post
    const isCreator = post.creatorId === authorId;

    // ML heuristics hook point for knowledge graph
    const isQuestion =
      text.includes("?") || text.toLowerCase().startsWith("how");

    const comment: CommentNode = {
      id: commentId,
      contentId,
      authorId,
      author: {
        id: profile.id,
        name: profile.fullName,
        avatar: profile.avatarUrl,
        verified: profile.verified,
        isCreator,
      },
      text,
      mentions,
      isPinned: false,
      isQuestion,
      isAnswer: false,
      likesCount: 0,
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.commentsDb.set(commentId, comment);

    // Update content counts
    post.commentsCount = (post.commentsCount || 0) + 1;

    // Process mentions
    this.processMentions(commentId, authorId, mentions);

    return comment;
  }

  // POST /reply
  public createReply(
    parentId: string,
    authorId: string,
    text: string,
    mentions: string[],
  ): CommentNode {
    const parentComment = this.commentsDb.get(parentId);
    if (!parentComment)
      throw new Error(`Parent comment ${parentId} does not exist`);

    const post = contentService.getPostDetails(parentComment.contentId);
    if (!post) throw new Error(`Content post does not exist`);

    const profile = profileRepository.findById(authorId);
    if (!profile) throw new Error(`Profile not found`);

    const commentId = "comment-" + crypto.randomBytes(8).toString("hex");
    const now = new Date().toISOString();
    const isCreator = post.creatorId === authorId;

    const reply: CommentNode = {
      id: commentId,
      contentId: parentComment.contentId,
      parentId,
      authorId,
      author: {
        id: profile.id,
        name: profile.fullName,
        avatar: profile.avatarUrl,
        verified: profile.verified,
        isCreator,
      },
      text,
      mentions,
      isPinned: false,
      isQuestion: false,
      isAnswer: parentComment.isQuestion, // If parent is question, this is probably an answer
      likesCount: 0,
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.commentsDb.set(commentId, reply);
    parentComment.repliesCount += 1;
    post.commentsCount = (post.commentsCount || 0) + 1;

    this.processMentions(commentId, authorId, mentions);

    return reply;
  }

  // PUT /comment
  public updateComment(
    commentId: string,
    authorId: string,
    text?: string,
    isPinned?: boolean,
  ): CommentNode {
    const comment = this.commentsDb.get(commentId);
    if (!comment) throw new Error(`Comment ${commentId} does not exist`);

    const post = contentService.getPostDetails(comment.contentId);
    if (!post) throw new Error(`Content post does not exist`);

    // Check authorization:
    // Author can edit text. Post creator can pin.
    const isPostCreator = post.creatorId === authorId;
    const isCommentAuthor = comment.authorId === authorId;

    if (text !== undefined && !isCommentAuthor) {
      throw new Error(`Only comment author can edit the text`);
    }

    if (isPinned !== undefined && !isPostCreator) {
      throw new Error(`Only the post creator can pin comments`);
    }

    if (text !== undefined) comment.text = text;

    if (isPinned !== undefined) {
      // Unpin all other comments for this post if pinning
      if (isPinned) {
        for (const [id, c] of this.commentsDb) {
          if (c.contentId === comment.contentId && c.isPinned) {
            c.isPinned = false;
          }
        }
      }
      comment.isPinned = isPinned;
    }

    comment.updatedAt = new Date().toISOString();
    return comment;
  }

  // DELETE /comment
  public deleteComment(commentId: string, requesterId: string): boolean {
    const comment = this.commentsDb.get(commentId);
    if (!comment) return false;

    const post = contentService.getPostDetails(comment.contentId);

    // Author or post creator can delete
    const isPostCreator = post?.creatorId === requesterId;
    const isCommentAuthor = comment.authorId === requesterId;

    if (!isPostCreator && !isCommentAuthor) {
      throw new Error(`Not authorized to delete comment`);
    }

    this.commentsDb.delete(commentId);

    if (post) {
      // rough count update, in real system we would recalculate properly or cascade delete replies
      post.commentsCount = Math.max(0, post.commentsCount - 1);
    }

    if (comment.parentId) {
      const parent = this.commentsDb.get(comment.parentId);
      if (parent) {
        parent.repliesCount = Math.max(0, parent.repliesCount - 1);
      }
    }

    return true;
  }

  // GET /content/:id/comments
  public getComments(contentId: string): CommentNode[] {
    const allComments = Array.from(this.commentsDb.values()).filter(
      (c) => c.contentId === contentId,
    );

    // Reconstruct nesting
    const roots: CommentNode[] = [];
    const childrenMap: Map<string, CommentNode[]> = new Map();

    for (const c of allComments) {
      if (c.parentId) {
        if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
        childrenMap.get(c.parentId)!.push(c);
      } else {
        roots.push(c);
      }
    }

    // Sort roots: pinned first, then chronological
    roots.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Attach children recursively
    const buildTree = (comments: CommentNode[]) => {
      for (const c of comments) {
        if (childrenMap.has(c.id)) {
          const children = childrenMap.get(c.id)!;
          children.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ); // chron order for replies
          c.replies = children;
          buildTree(children);
        } else {
          c.replies = [];
        }
      }
    };

    buildTree(roots);
    return roots;
  }

  private processMentions(
    commentId: string,
    authorId: string,
    mentions: string[],
  ) {
    // Dispatch notifications for mentions
    for (const mentionedId of mentions) {
      if (mentionedId !== authorId) {
        console.log(
          `[MENTION] User ${authorId} mentioned ${mentionedId} in comment ${commentId}`,
        );
      }
    }
  }
}

export const commentService = new CommentService();
