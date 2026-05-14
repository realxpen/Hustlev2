import { prisma } from "../prisma/client.js";
import { tokenService } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";

export async function authenticate(req, _res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token is required.");
    }

    const token = authorizationHeader.split(" ")[1];
    const payload = tokenService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Authenticated user no longer exists or is inactive.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication is required."));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, "You do not have permission to access this resource."));
      return;
    }

    next();
  };
}
