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
      token: tokenService.generateAccessToken(user),
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
      token: tokenService.generateAccessToken(updatedUser),
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
};
