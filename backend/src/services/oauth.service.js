import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { tokenService } from "./token.service.js";
import { ApiError } from "../utils/ApiError.js";

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  phone: true,
  profilePhoto: true,
  bio: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export const oauthService = {
  async handleGoogleLogin(googleProfile) {
    const email = googleProfile.email.toLowerCase().trim();
    const providerId = googleProfile.id;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.provider !== "google" && user.provider === "local") {
      throw new ApiError(
        409,
        "This email is already registered with a local account. Please sign in with your password.",
      );
    }

    if (!user) {
      const username = this.generateUniqueUsername(googleProfile.name);

      user = await prisma.user.create({
        data: {
          username,
          email,
          provider: "google",
          providerId,
          profilePhoto: googleProfile.picture,
          isVerified: true,
        },
      });
    } else if (user.provider === "google" && user.providerId !== providerId) {
      throw new ApiError(400, "Google profile mismatch. Please contact support.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });

    return {
      accessToken: tokenService.generateAccessToken(updatedUser),
      refreshToken: tokenService.generateRefreshToken(updatedUser),
      user: updatedUser,
    };
  },

  async handleAppleLogin(appleProfile) {
    const email = appleProfile.email?.toLowerCase().trim();
    const providerId = appleProfile.sub || appleProfile.id;

    if (!email) {
      throw new ApiError(400, "Apple profile missing email. Please enable email sharing in Apple ID settings.");
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.provider !== "apple" && user.provider === "local") {
      throw new ApiError(
        409,
        "This email is already registered with a local account. Please sign in with your password.",
      );
    }

    if (!user) {
      const username = this.generateUniqueUsername(appleProfile.name);

      user = await prisma.user.create({
        data: {
          username,
          email,
          provider: "apple",
          providerId,
          isVerified: true,
        },
      });
    } else if (user.provider === "apple" && user.providerId !== providerId) {
      throw new ApiError(400, "Apple profile mismatch. Please contact support.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });

    return {
      accessToken: tokenService.generateAccessToken(updatedUser),
      refreshToken: tokenService.generateRefreshToken(updatedUser),
      user: updatedUser,
    };
  },

  async linkOAuthAccount(userId, provider, providerId, profileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (user.provider !== "local") {
      throw new ApiError(
        400,
        `Account is already linked with ${user.provider}. Cannot link multiple OAuth providers.`,
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        provider,
        providerId,
        profilePhoto: profileData?.picture || user.profilePhoto,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    return updatedUser;
  },

  generateUniqueUsername(name) {
    const baseUsername = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .substring(0, 35);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseUsername}_${randomSuffix}`.substring(0, 40);
  },
};
