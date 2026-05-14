import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const prismaClientSingleton = () =>
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
