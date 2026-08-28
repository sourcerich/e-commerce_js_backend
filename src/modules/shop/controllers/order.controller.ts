import { Request, Response } from "express";
import { order } from "../models/init-models";
import { getUserId } from "../../../utils/users";
import { placeOrder } from "../common/placeOrder";
import { successDataHandle, errorMessageHandle } from "../../../utils/responsehandler";
import { AuthRequest } from "../../../middleware/auth";

// POST /v1/orders  -> place an order (uses shared common/ logic)
export async function createOrder(req: AuthRequest, res: Response) {
  try {
    // The global authMiddleware already verified the token and set req.user.
    const userId = getUserId(req);
    const { lines } = req.body;

    const result = await placeOrder(userId, lines);
    return res
      .status(200)
      .json(successDataHandle(result, "Order placed"));
  } catch (error: any) {
    // Business rule errors (out of stock, empty cart) are client errors -> 400.
    // Anything else is a server error -> 500. Both keep the same envelope shape.
    const isBusinessError =
      /stock|at least one line|not found/i.test(error?.message || "");
    const statusCode = isBusinessError ? 400 : 500;
    return res.status(200).json({
      status: false,
      status_code: statusCode,
      code: "FAILED",
      message: error?.message || "Failed to place order",
    });
  }
}

// GET /v1/orders/:id  -> order + its line items
export async function getOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const o = await order.findByPk(Number(id), {
      include: [{ model: order.associations.items?.target || order, as: "items" }],
    });
    if (!o) {
      return res.status(200).json({
        status: false,
        status_code: 404,
        code: "FAILED",
        message: "Order not found",
      });
    }
    return res.status(200).json(successDataHandle(o));
  } catch (error) {
    return res.status(200).json(errorMessageHandle("Failed to load order", error));
  }
}
