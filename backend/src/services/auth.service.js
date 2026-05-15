import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { SELF_REGISTRATION_ROLES } from "../modules/users/user.constants.js";
import { tokenService } from "./token.service.js";
import { ApiError } from "../utils/ApiError.js";

export const publicUserSelect = {
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

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function sanitizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildRegistrationConflictQuery({ username, email, phone }) {
  const filters = [{ username }, { email: normalizeEmail(email) }];

  if (phone) {
    filters.push({ phone });
  }

  return filters;
}

export const authService = {
  async register(payload) {
    const role = payload.role || "client";

    if (!SELF_REGISTRATION_ROLES.includes(role)) {
      throw new ApiError(
        400,
        "Self-service registration currently supports only client and hustler accounts.",
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: buildRegistrationConflictQuery(payload),
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ApiError(409, "A user with this email, username, or phone already exists.");
    }

    const hashedPassword = await bcrypt.hash(payload.password, env.bcryptSaltRounds);

    // The service returns a response-safe user shape so controllers never expose password hashes.
    const user = await prisma.user.create({
      data: {
        username: payload.username.trim(),
        email: normalizeEmail(payload.email),
        phone: sanitizeOptionalString(payload.phone),
        password: hashedPassword,
        role,
      },
      select: publicUserSelect,
    });

    return {
      accessToken: tokenService.generateAccessToken(user),
      refreshToken: tokenService.generateRefreshToken(user),
      user,
    };
  },

  async login(payload) {
    const identifier = payload.emailOrUsername.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizeEmail(identifier) },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid login credentials.");
    }

    if (!user.isActive) {
      throw new ApiError(403, "This account is inactive.");
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);

    if (!passwordMatches) {
      throw new ApiError(401, "Invalid login credentials.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
      select: publicUserSelect,
    });

    return {
      accessToken: tokenService.generateAccessToken(updatedUser),
      refreshToken: tokenService.generateRefreshToken(updatedUser),
      user: updatedUser,
    };
  },

  async getAuthenticatedUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return user;
  },

  async refreshAccessToken(refreshToken) {
    const payload = tokenService.verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "User no longer exists or is inactive.");
    }

    return {
      accessToken: tokenService.generateAccessToken(user),
      user,
    };
  },

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, "User with this email not found.");
    }

    const resetToken = tokenService.generatePasswordResetToken(user.id);

    return {
      resetToken,
      message: "Password reset token generated. Use this token to reset your password.",
    };
  },

  async resetPassword(resetToken, newPassword) {
    const payload = tokenService.verifyPasswordResetToken(resetToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or is inactive.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      message: "Password reset successfully.",
    };
  },

  async sendVerificationEmail(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isVerified: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (user.isVerified) {
      throw new ApiError(400, "User is already verified.");
    }

    const verificationToken = tokenService.generateEmailVerificationToken(userId);

    return {
      verificationToken,
      message: "Email verification token generated. Use this token to verify your email.",
    };
  },

  async verifyEmail(verificationToken) {
    const payload = tokenService.verifyEmailVerificationToken(verificationToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isVerified: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (user.isVerified) {
      throw new ApiError(400, "User is already verified.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return {
      message: "Email verified successfully.",
    };
  },
};
