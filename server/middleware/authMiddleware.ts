import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "hustle_super_secure_access_secret_2026";

// JWT Authentication core middleware
export const authenticateJWT: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: "Authentication credentials required. Please provide a Bearer JWT."
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({
      success: false,
      error: "Malformed credentials schema. Format must be 'Bearer <token>'."
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: "Expired or invalid session token. Please re-authenticate."
    });
  }
};

// Check if user contains Hustler validation cleared status
export const requireHustlerRole: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required to perform this action."
    });
    return;
  }

  if (req.user.role !== "Hustler") {
    res.status(403).json({
      success: false,
      error: "Refused access. This feature is restricted exclusively to authorized Hustlers."
    });
    return;
  }

  next();
};

// Check if user contains Client role
export const requireClientRole: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required."
    });
    return;
  }

  if (req.user.role !== "Client") {
    res.status(403).json({
      success: false,
      error: "Access limited to Client users."
    });
    return;
  }

  next();
};

/**
 * Passive JWT Extractor Middleware
 * Unlike authenticateJWT, if there is no token or it's expired,
 * it passes control smoothly to next() instead of rejecting.
 * This guarantees guest discovery experience works!
 */
export const extractPassiveUser: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return next();
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    req.user = decoded;
  } catch (err) {
    // Quietly ignore and proceed as guest session
  }
  next();
};
