import jwt from "jsonwebtoken";

export const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      req.user.role = user.role; // attach role for reuse

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};

export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
