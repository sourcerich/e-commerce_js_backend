import { AuthRequest } from "../middleware/auth";

// Reads the userId that the global authMiddleware already attached to req.user.
// Because auth runs first, this is safe to call in any protected controller.
export const getUserId = (req: AuthRequest): number => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error("Invalid token");
  }
  return userId;
};
