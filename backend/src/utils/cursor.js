import { ApiError } from "./ApiError.js";

export function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return parsed;
  } catch (_error) {
    throw new ApiError(400, "Invalid pagination cursor.");
  }
}

export function buildNextCursor(items, buildPayload) {
  if (!items.length) {
    return null;
  }

  return encodeCursor(buildPayload(items.at(-1)));
}
