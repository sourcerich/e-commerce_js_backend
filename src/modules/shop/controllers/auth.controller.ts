import { Request, Response } from "express";
import { signToken } from "../../../middleware/auth";
import { successDataHandle, errorMessageHandle } from "../../../utils/responsehandler";

// POST /v1/login  -> PUBLIC route (mounted outside the auth guard).
// Mints a demo token. In a real app you would verify a password against the DB.
export async function login(req: Request, res: Response) {
  try {
    const { email, userId } = req.body;
    if (!userId) {
      return res.status(200).json({
        status: false,
        status_code: 400,
        code: "FAILED",
        message: "userId is required",
      });
    }
    const token = signToken({ userId: Number(userId), email });
    return res.status(200).json(successDataHandle({ token }, "Logged in"));
  } catch (error) {
    return res.status(200).json(errorMessageHandle("Login failed", error));
  }
}
