import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    files: env.maxMediaFiles * 2,
    fileSize: env.maxMediaFileSizeMb * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, `Unsupported media type: ${file.mimetype}`));
      return;
    }

    callback(null, true);
  },
});

export function uploadPostFiles(req, res, next) {
  const handler = upload.fields([
    { name: "media", maxCount: env.maxMediaFiles },
    { name: "thumbnails", maxCount: env.maxMediaFiles },
  ]);

  handler(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(new ApiError(400, error.message));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    const files = req.files || {};
    const mediaFiles = files.media || [];
    const thumbnailFiles = files.thumbnails || [];

    if (!mediaFiles.length && thumbnailFiles.length) {
      next(new ApiError(400, "Thumbnail uploads require at least one media file."));
      return;
    }

    if (thumbnailFiles.some((file) => !file.mimetype.startsWith("image/"))) {
      next(new ApiError(400, "Thumbnails must be image files."));
      return;
    }

    next();
  });
}
