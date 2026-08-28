import { Router } from "express";
import { getProduct, listProducts, createProduct } from "../controllers/product.controller";
import { createOrder, getOrder } from "../controllers/order.controller";
import { login } from "../controllers/auth.controller";

// Protected router: mounted with authMiddleware in index.ts, so every route
// below REQUIRES a valid token (req.user is guaranteed to exist).
const router = Router();
router.get("/products", listProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.post("/orders", createOrder);
router.get("/orders/:id", getOrder);

export const shop = router;

// Public router: NO auth guard. Used for endpoints that must work anonymously.
const publicRouter = Router();
publicRouter.post("/login", login);

export const shopPublic = publicRouter;
