export interface EngagementActionPayload {
  postId?: string;
  creatorId?: string;
}

export interface ReportPayload {
  targetId: string;
  targetType: 'post' | 'user' | 'comment';
  reason: string;
}

export function validateEngagementAction(body: any): { error?: string; value?: EngagementActionPayload } {
  if (!body || (!body.postId && !body.creatorId)) {
    return { error: 'postId or creatorId parameter is required in request body' };
  }
  return { value: { postId: body.postId, creatorId: body.creatorId } };
}

export function validateReportAction(body: any): { error?: string; value?: ReportPayload } {
  if (!body || !body.targetId || !body.targetType || !body.reason) {
    return { error: 'targetId, targetType, and reason are required' };
  }
  return { 
    value: { 
      targetId: body.targetId, 
      targetType: body.targetType, 
      reason: body.reason 
    } 
  };
}
