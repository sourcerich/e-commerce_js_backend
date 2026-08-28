import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Augment Express's Request so controllers can read req.user without casts.
export interface AuthRequest extends Request {
  user?: { userId: number; email?: string };
}

// Global auth middleware. Mounted once on app.use("/v1", authMiddleware, router)
// so EVERY protected route rejects a missing/invalid token before the handler runs.
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      status: false,
      status_code: 401,
      code: "FAILED",
      message: "Missing Authorization header",
    });
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email?: string;
    };
    req.user = { userId: decoded.userId, email: decoded.email };
    return next(); // allowed -> continue to the route handler
  } catch {
    return res.status(401).json({
      status: false,
      status_code: 401,
      code: "FAILED",
      message: "Invalid token",
    });
  }
}

// Helper used by the public login route to mint a token for a user.
export function signToken(payload: { userId: number; email?: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}
