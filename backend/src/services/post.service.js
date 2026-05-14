import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeHashtags } from "../utils/hashtags.js";
import { buildPostSelect, serializePost } from "../utils/postQueries.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { publishFeedEvent } from "../sockets/publisher.js";
import { getVisiblePostOrThrow } from "./post.common.js";
import { uploadService } from "./upload.service.js";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function derivePostType(requestedType, media) {
  if (requestedType) {
    return requestedType;
  }

  if (!media.length) {
    return "text";
  }

  const mediaTypes = [...new Set(media.map((item) => item.mediaType))];

  if (mediaTypes.length > 1) {
    return "mixed";
  }

  return mediaTypes[0] === "video" ? "video" : "image";
}

function buildAttachmentData(attachment) {
  if (!attachment) {
    return {
      attachmentType: null,
      attachmentId: null,
      attachmentTitle: null,
      attachmentSubtitle: null,
      attachmentThumbnailUrl: null,
      attachmentPriceMinor: null,
      attachmentCurrency: null,
      attachmentMetadata: null,
    };
  }

  return {
    attachmentType: attachment.type,
    attachmentId: attachment.entityId,
    attachmentTitle: attachment.title,
    attachmentSubtitle: attachment.subtitle?.trim() || null,
    attachmentThumbnailUrl: attachment.thumbnailUrl || null,
    attachmentPriceMinor: attachment.priceMinor ?? null,
    attachmentCurrency: attachment.currency?.trim() || null,
    attachmentMetadata: attachment.metadata ?? null,
  };
}

export const postService = {
  async createPost(userId, payload, files) {
    const externalMedia = payload.media || [];
    const media = await uploadService.preparePostMedia({
      userId,
      mediaFiles: files?.media || [],
      thumbnailFiles: files?.thumbnails || [],
      externalMedia,
    });

    const caption = normalizeOptionalString(payload.caption);
    const attachment = payload.attachment;

    if (!caption && !media.length && !attachment) {
      throw new ApiError(400, "A post must contain caption text, media, or an attachment.");
    }

    const hashtags = normalizeHashtags(payload.hashtags || [], caption || "");
    const postType = derivePostType(payload.type, media);
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        type: postType,
        visibility: payload.visibility,
        caption,
        hashtags,
        musicTitle: payload.audio?.title?.trim() || null,
        musicArtist: payload.audio?.artist?.trim() || null,
        musicUrl: payload.audio?.url?.trim() || null,
        allowComments: payload.allowComments,
        mediaCount: media.length,
        ...buildAttachmentData(attachment),
        media: {
          create: media.map((item) => ({
            mediaType: item.mediaType,
            url: item.url,
            publicId: item.publicId,
            mimeType: item.mimeType,
            format: item.format,
            resourceType: item.resourceType,
            width: item.width,
            height: item.height,
            durationSeconds: item.durationSeconds,
            bytes: item.bytes,
            thumbnailUrl: item.thumbnailUrl,
            altText: item.altText,
            sortOrder: item.sortOrder,
          })),
        },
      },
      select: buildPostSelect(userId),
    });

    publishFeedEvent(SOCKET_EVENTS.postCreated, {
      postId: post.id,
      authorId: userId,
      createdAt: post.createdAt,
      type: post.type,
    });

    return serializePost(post);
  },

  async getPostById(postId, viewerId) {
    const post = await getVisiblePostOrThrow(postId, viewerId);
    return serializePost(post);
  },
};
