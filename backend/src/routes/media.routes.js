import express from "express";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { upload } from "../middleware/upload.middleware.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * UPLOAD VIDEO/IMAGE
 */
router.post(
  "/upload",
  authenticateUser,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "hustle_uploads",
        },
        (error, result) => {
          if (error) {
            console.error("CLOUDINARY ERROR:", error); // 👈 ADD THIS

            return res.status(500).json({
              success: false,
              message: "Upload failed",
              error: error.message, // 👈 ADD THIS
            });
          }

          return res.json({
            success: true,
            message: "Upload successful",
            data: {
              url: result.secure_url,
              public_id: result.public_id,
            },
          });
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

export default router;
