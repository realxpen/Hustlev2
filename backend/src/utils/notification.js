import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createNotification = async ({
  userId,
  type,
  message,
}) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
};