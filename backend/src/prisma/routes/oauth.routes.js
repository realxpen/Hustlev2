import { Router } from "express";
import passport from "passport";
import { oauthController } from "../../controllers/oauth.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { env } from "../../config/env.js";

const router = Router();

const isProduction = env.nodeEnv === "production";

const redirectOnSuccess = (req, res) => {
  const user = req.user;
  if (!user) {
    return res.redirect(`${env.appUrl}?error=authentication_failed`);
  }

  const params = new URLSearchParams({
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    userId: user.user.id,
    username: user.user.username,
  });

  res.redirect(`${env.appUrl}/auth/callback?${params.toString()}`);
};

const redirectOnFailure = (req, res) => {
  res.redirect(`${env.appUrl}?error=authentication_failed`);
};

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: true,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: env.appUrl,
    session: false,
  }),
  asyncHandler(oauthController.googleCallback),
  redirectOnSuccess,
);

// Apple OAuth
router.post(
  "/apple",
  passport.authenticate("apple", {
    session: false,
  }),
);

router.post(
  "/apple/callback",
  passport.authenticate("apple", {
    failureRedirect: env.appUrl,
    session: false,
  }),
  asyncHandler(oauthController.appleCallback),
  redirectOnSuccess,
);

export default router;
