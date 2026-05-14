export function sendSuccess(res, { statusCode = 200, message = "OK", data = null, meta = null }) {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
}
