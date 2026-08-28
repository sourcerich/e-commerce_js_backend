import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { shop, shopPublic } from "./modules/shop/route/route";
import { sequelizeDB } from "./config/index";
import { authMiddleware } from "./middleware/auth";

dotenv.config();
const app = express();

const port = process.env.PORT ?? 8080;

// Parse JSON bodies -> req.body, allow cross-origin browser calls.
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Sync models to the DB at startup (dev convenience). In production you would
// manage schema with real migration SQL instead of sync({ alter: true }).
sequelizeDB
  .authenticate()
  .then(() => {
    console.log("Connected to db");
    return sequelizeDB.sync({ alter: true });
  })
  .then(() => console.log("Models synced"))
  .catch((error: Error) => console.log("DB error:", error.message));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).type("txt").send("Hello from ecommerce API");
});

// Mount the PUBLIC router first so /v1/login is handled without a token.
// (If a /v1 route isn't in shopPublic, its router calls next() and falls
// through to the guarded router below.)
app.use("/v1", shopPublic);
// EVERY other /v1 route runs authMiddleware first; it attaches req.user
// before the handler.
app.use("/v1", authMiddleware, shop);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).type("txt").send("Not Found");
});

// error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  res.status(500).json({ status: false, code: "FAILED", message: err.message });
});

app.listen(port, () => {
  console.log(`ecommerce API up on port ${port}`);
});
