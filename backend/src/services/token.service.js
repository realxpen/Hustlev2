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
      env.jwtAccessSecret,
      {
        expiresIn: env.jwtAccessExpiresIn,
      },
    );
  },

  generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        type: "refresh",
      },
      env.jwtRefreshSecret,
      {
        expiresIn: env.jwtRefreshExpiresIn,
      },
    );
  },

  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.jwtAccessSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired authentication token.");
    }
  },

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, env.jwtRefreshSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired refresh token.");
    }
  },

  generatePasswordResetToken(userId) {
    return jwt.sign(
      {
        sub: userId,
        type: "password_reset",
      },
      env.jwtSecret,
      {
        expiresIn: `${env.auth.passwordResetExpiresMinutes}m`,
      },
    );
  },

  verifyPasswordResetToken(token) {
    try {
      return jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired password reset token.");
    }
  },

  generateEmailVerificationToken(userId) {
    return jwt.sign(
      {
        sub: userId,
        type: "email_verification",
      },
      env.jwtSecret,
      {
        expiresIn: `${env.auth.emailVerificationExpiresHours}h`,
      },
    );
  },

  verifyEmailVerificationToken(token) {
    try {
      return jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired email verification token.");
    }
  },

  generateOAuthStateToken() {
    return jwt.sign(
      {
        type: "oauth_state",
      },
      env.jwtStateSecret,
      {
        expiresIn: `${env.auth.oauthStateExpiresMinutes}m`,
      },
    );
  },

  verifyOAuthStateToken(token) {
    try {
      return jwt.verify(token, env.jwtStateSecret);
    } catch (_error) {
      throw new ApiError(401, "Invalid or expired OAuth state token.");
    }
  },
};
