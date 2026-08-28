import { Request, Response } from "express";
import { Op } from "sequelize";
import { product } from "../models/init-models";
import { successDataHandle, errorMessageHandle } from "../../../utils/responsehandler";

// GET /v1/products/:id  -> single product
export async function getProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const p = await product.findByPk(Number(id), { raw: true });
    if (!p) {
      return res
        .status(200)
        .json({ status: false, status_code: 404, code: "FAILED", message: "Product not found" });
    }
    return res.status(200).json(successDataHandle(p));
  } catch (error) {
    return res.status(200).json(errorMessageHandle("Failed to load product", error));
  }
}

// GET /v1/products  -> list (optional ?search=)
export async function listProducts(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
    const rows = await product.findAll({ where, raw: true });
    return res.status(200).json(successDataHandle(rows));
  } catch (error) {
    return res.status(200).json(errorMessageHandle("Failed to list products", error));
  }
}

// POST /v1/products  -> create (protected; any logged-in user in this demo)
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, price, stock } = req.body;
    if (!name || price == null) {
      return res.status(200).json({
        status: false,
        status_code: 400,
        code: "FAILED",
        message: "name and price are required",
      });
    }
    const p = await product.create({
      name,
      price,
      stock: stock ?? 0,
    });
    return res.status(200).json(successDataHandle(p, "Product created"));
  } catch (error) {
    return res.status(200).json(errorMessageHandle("Failed to create product", error));
  }
}
