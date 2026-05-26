import type { CommentThread } from '../../../types/index';

export function buildCommentTree(flatComments: any[]): CommentThread[] {
  const commentMap: Record<string, CommentThread> = {};
  const rootComments: CommentThread[] = [];

  // First pass: Create a map of all comments
  flatComments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // Second pass: Build the tree
  flatComments.forEach(comment => {
    const commentWithReplies = commentMap[comment.id];
    if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
      commentMap[comment.parent_comment_id].replies!.push(commentWithReplies);
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  // Sort root comments and all nested replies by created_at DESC (newest first)
  const sortRecursive = (comments: CommentThread[]) => {
    comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    comments.forEach(c => {
      if (c.replies && c.replies.length > 0) {
        sortRecursive(c.replies);
      }
    });
  };

  sortRecursive(rootComments);
  return rootComments;
}
