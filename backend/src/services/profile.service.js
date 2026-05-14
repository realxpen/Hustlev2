import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { publicUserSelect } from "./auth.service.js";

function normalizeNullableString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureProfileFieldAvailability(userId, payload) {
  const conflictChecks = [];

  if (payload.username) {
    conflictChecks.push({ username: payload.username.trim() });
  }

  if (payload.phone) {
    conflictChecks.push({ phone: payload.phone.trim() });
  }

  if (conflictChecks.length === 0) {
    return;
  }

  const conflict = await prisma.user.findFirst({
    where: {
      id: {
        not: userId,
      },
      OR: conflictChecks,
    },
    select: { id: true },
  });

  if (conflict) {
    throw new ApiError(409, "Username or phone number is already in use.");
  }
}

export const profileService = {
  async getMyProfile(userId) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!profile) {
      throw new ApiError(404, "Profile not found.");
    }

    return profile;
  },

  async updateMyProfile(userId, payload) {
    await ensureProfileFieldAvailability(userId, payload);

    const profile = await prisma.user.update({
      where: { id: userId },
      data: {
        username: payload.username?.trim(),
        phone: normalizeNullableString(payload.phone),
        profilePhoto: normalizeNullableString(payload.profilePhoto),
        bio: normalizeNullableString(payload.bio),
      },
      select: publicUserSelect,
    });

    return profile;
  },
};
