import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const tokenService = {
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      },
    );
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired authentication token.");
    }
  },
};
