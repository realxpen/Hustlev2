import dotenv from "dotenv";

dotenv.config();

const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const stateSecret = process.env.JWT_STATE_SECRET || process.env.JWT_SECRET;

const requiredVariables = ["DATABASE_URL"];
const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}. Copy backend/.env.example to backend/.env first.`,
  );
}

if (!accessSecret || !refreshSecret || !stateSecret) {
  throw new Error(
    "Missing JWT secrets. Configure JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and JWT_STATE_SECRET or provide JWT_SECRET as a fallback.",
  );
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toArray(value, fallback) {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || accessSecret,
  jwtAccessSecret: accessSecret,
  jwtRefreshSecret: refreshSecret,
  jwtStateSecret: stateSecret,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  clientOrigins: toArray(process.env.CLIENT_URL, ["http://localhost:3000"]),
  appUrl: process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:3000",
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 200),
  authRateLimitMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  postRateLimitMax: toNumber(process.env.POST_RATE_LIMIT_MAX, 20),
  engagementRateLimitMax: toNumber(process.env.ENGAGEMENT_RATE_LIMIT_MAX, 120),
  commentRateLimitMax: toNumber(process.env.COMMENT_RATE_LIMIT_MAX, 60),
  maxMediaFiles: toNumber(process.env.MAX_MEDIA_FILES, 10),
  maxMediaFileSizeMb: toNumber(process.env.MAX_MEDIA_FILE_SIZE_MB, 25),
  auth: {
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || "hustle_refresh_token",
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN || null,
    cookieSecure: toBoolean(process.env.AUTH_COOKIE_SECURE, process.env.NODE_ENV === "production"),
    cookieSameSite: process.env.AUTH_COOKIE_SAME_SITE || "lax",
    setRefreshCookie: toBoolean(process.env.AUTH_SET_REFRESH_COOKIE, true),
    allowedRedirects: toArray(process.env.AUTH_ALLOWED_REDIRECTS, toArray(process.env.CLIENT_URL, ["http://localhost:3000"])),
    passwordResetExpiresMinutes: toNumber(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES, 30),
    emailVerificationExpiresHours: toNumber(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS, 24),
    oauthHandoffExpiresMinutes: toNumber(process.env.OAUTH_HANDOFF_EXPIRES_MINUTES, 5),
    oauthStateExpiresMinutes: toNumber(process.env.OAUTH_STATE_EXPIRES_MINUTES, 10),
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || "",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      teamId: process.env.APPLE_TEAM_ID || "",
      keyId: process.env.APPLE_KEY_ID || "",
      privateKey: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      callbackUrl: process.env.APPLE_CALLBACK_URL || "",
    },
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
});
