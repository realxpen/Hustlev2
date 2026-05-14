import { Readable } from "node:stream";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function inferMediaType(mimeType) {
  return mimeType.startsWith("video/") ? "video" : "image";
}

function normalizeExternalMedia(media, index) {
  return {
    mediaType: media.mediaType,
    url: media.url,
    publicId: normalizeOptionalString(media.publicId),
    mimeType: normalizeOptionalString(media.mimeType),
    format: normalizeOptionalString(media.format),
    resourceType: media.mediaType,
    width: media.width ?? null,
    height: media.height ?? null,
    durationSeconds: media.durationSeconds ?? null,
    bytes: media.bytes ?? null,
    thumbnailUrl: normalizeOptionalString(media.thumbnailUrl),
    altText: normalizeOptionalString(media.altText),
    sortOrder: index,
  };
}

function uploadBufferToCloudinary(file, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(new ApiError(502, "Cloudinary upload failed.", error));
        return;
      }

      resolve(result);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

async function uploadMediaFile(userId, file, folder) {
  const resourceType = inferMediaType(file.mimetype);
  const uploadResult = await uploadBufferToCloudinary(file, {
    folder: `hustle/${folder}/${userId}`,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  });

  return {
    mediaType: resourceType,
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    mimeType: file.mimetype,
    format: uploadResult.format,
    resourceType,
    width: uploadResult.width ?? null,
    height: uploadResult.height ?? null,
    durationSeconds: uploadResult.duration ?? null,
    bytes: uploadResult.bytes ?? null,
  };
}

export const uploadService = {
  async preparePostMedia({ userId, mediaFiles = [], thumbnailFiles = [], externalMedia = [] }) {
    if (mediaFiles.length && externalMedia.length) {
      throw new ApiError(400, "Send either uploaded media files or external media URLs, not both.");
    }

    if (!mediaFiles.length) {
      return externalMedia.map((media, index) => normalizeExternalMedia(media, index));
    }

    if (!isCloudinaryConfigured) {
      throw new ApiError(
        503,
        "Cloudinary is not configured for server-side uploads. Add Cloudinary credentials to backend/.env first.",
      );
    }

    if (thumbnailFiles.length > mediaFiles.length) {
      throw new ApiError(400, "Thumbnail count cannot exceed media count.");
    }

    const uploadedThumbnails = await Promise.all(
      thumbnailFiles.map((file) => uploadMediaFile(userId, file, "post-thumbnails")),
    );

    const uploadedMedia = await Promise.all(
      mediaFiles.map((file) => uploadMediaFile(userId, file, "posts")),
    );

    return uploadedMedia.map((media, index) => ({
      ...media,
      thumbnailUrl: uploadedThumbnails[index]?.url ?? null,
      altText: null,
      sortOrder: index,
    }));
  },
};
