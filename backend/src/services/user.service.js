import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { publicUserSelect } from "./auth.service.js";

export const userService = {
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return user;
  },

  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return user;
  },
};
