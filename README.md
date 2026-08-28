# ecommerce-api

A small Express + Sequelize + TypeScript **e-commerce backend** learning example:
products, orders (with line items), authentication via JWT, and a reusable
`placeOrder` business flow wrapped in a database transaction.

The codebase follows the conventions of the express stack
(Express / TypeScript / Sequelize / MySQL) but stays deliberately minimal so the
patterns are easy to follow: feature-grouped folders, thin controllers, business
logic in `common/`, a shared response envelope, and one global auth guard.

---

## Tech stack

| Concern      | Tool                                            |
| ------------ | ----------------------------------------------- |
| Web server   | Express 4                                       |
| ORM          | Sequelize 6 (+ `mysql2`)                         |
| Language     | TypeScript (compiled to CommonJS into `dist/`)  |
| Auth         | JSON Web Tokens (`jsonwebtoken`)                 |
| Config/secret| `dotenv` + `.env`                               |
| Lint         | ESLint 9 (`eslint.config.mjs`)                  |
| Dev runtime  | `ts-node` + `nodemon` (hot reload)              |

---

## Folder structure

```
ecommerce-api/
├─ .env.example          # template for your local secrets (copy -> .env)
├─ .gitignore            # never commit .env, node_modules, dist
├─ package.json          # dependencies + scripts
├─ tsconfig.json         # TypeScript rules (module: commonjs, outDir: dist)
├─ eslint.config.mjs     # lint rules
└─ src/
   ├─ index.ts           # ENTRY POINT: builds the Express app, mounts routers
   ├─ config/            # DB connection wiring (reads env, builds Sequelize)
   │  ├─ db.config.ts
   │  └─ index.ts        # exports the singleton `sequelizeDB` + initModels
   ├─ middleware/
   │  └─ auth.ts         # global authMiddleware + signToken
   ├─ utils/             # cross-cutting helpers shared by features
   │  ├─ responsehandler.ts   # standard response envelope
   │  └─ users.ts             # getUserId(req) from the token
   └─ modules/
      └─ shop/           # one folder per feature
         ├─ models/      # Sequelize models + init-models.ts registry
         │  ├─ product.ts
         │  ├─ order.ts
         │  ├─ orderItem.ts
         │  └─ init-models.ts
         ├─ controllers/ # thin HTTP handlers
         │  ├─ product.controller.ts
         │  ├─ order.controller.ts
         │  └─ auth.controller.ts
         ├─ common/      # reusable business logic (no HTTP dependency)
         │  └─ placeOrder.ts
         └─ route/
            └─ route.ts  # URL -> controller mapping (protected + public)
```

### Why this layout?

- **Grouped by feature**, not by type. Everything about `shop` lives in one
  folder, so the blast radius of a change is obvious.
- **models/** = tables. **controllers/** = HTTP handlers. **common/** = logic
  that two or more controllers reuse (so it can also run from a test or a
  background job). **route/** = thin glue from URL to controller.
- **utils/** = helpers many features share (response envelope, decode token).
- **middleware/** = functions that run *before* the handler (auth).
- **The single most important idea: controllers stay thin.** A controller
  parses the request, calls a `common/` function, and returns a response. The
  real logic lives in `common/` so it can be reused and tested without an HTTP
  request.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

This installs both `dependencies` (runtime) and `devDependencies` (TypeScript,
ESLint, nodemon). At deploy time, `npm ci --only=production` installs only the
runtime packages, keeping the image small.

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env` contents:

```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=password
DB_PORT=3306
DB_SCHEMA=ecommerce
DB_DIALECT=mysql

JWT_SECRET=change-me-to-a-long-random-string
PORT=8080
```

> **Never commit `.env`.** Secrets are injected at deploy time, not stored in
> the repo. `node_modules/`, `dist/`, `.env`, and `.env.test` are excluded via
> `.gitignore`.

### 3. Run the database

The app expects a reachable MySQL (or compatible) server using the credentials
above. On startup it calls `sequelizeDB.sync({ alter: true })`, which creates /
updates the tables to match the models. This is a **dev convenience** — in
production you would manage schema with real migration SQL instead.

### 4. Run it

```bash
# Development — hot reload (ts-node + nodemon), no compile step
npm run start

# Production — serve the compiled output
npm run build      # lint + tsc -> dist/
npm run start:prod # node dist/index.js
```

The server prints `ecommerce API up on port 8080` (or `$PORT`).

---

## How it works

### Database connection (`src/config`)

`db.config.ts` reads settings from env vars (so the same code runs against dev /
prod) and declares a connection **pool** — reused open connections instead of a
new one per request. `config/index.ts` creates the single `sequelizeDB`
instance and registers every model via `initModels(sequelizeDB)`.

```ts
// config/index.ts (excerpt)
export const sequelizeDB = new Sequelize(
  dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD,
  { host: dbConfig.HOST, port: Number(dbConfig.PORT),
    dialect: "mysql", pool: { max: 10, min: 0, acquire: 30000, idle: 10000 } },
);
initModels(sequelizeDB); // bind models to this connection
```

Controllers import models from `init-models`, **never the raw model file** — that
guarantees the model is already bound to the connection (no "model not
initialized" errors) and gives one place to see all tables.

### Models & init-models (`src/modules/shop/models`)

Three tables:

- **product** — `id`, `name` (string), `price` (DECIMAL(10,2)), `stock`
  (int, default 0).
- **order** — `id`, `userId`, `total` (DECIMAL(10,2)), `status`
  enum (`pending` | `paid` | `cancelled`, default `pending`).
- **orderItem** — `id`, `orderId`, `productId`, `quantity`, `unitPrice`
  (DECIMAL(10,2)).

Associations (set in `initModels`): `order.hasMany(orderItem)` and
`orderItem.belongsTo(order)` / `belongsTo(product)`, so you can do
`order.getOrderItems()` etc.

When you add a model you touch five places in `init-models.ts`: value import,
type import, re-export value, re-export types, and register + `initModel`.
This repo already wires all three.

> **Gotcha:** optional (`?`) fields are typed `T | undefined`, **not**
> `T | null`. Passing `null` causes a TS error — use `value || undefined`.

### Controllers, utils, and common

- **Controllers** are thin `async (req, res)` handlers: validate input, call a
  `common/` function, shape the JSON. Examples: `getProduct`, `listProducts`,
  `createProduct`, `createOrder`, `getOrder`, `login`.
- **utils/responsehandler.ts** provides the standard response envelope used by
  every endpoint:
  ```ts
  { status: boolean, status_code: number, code: string, message: string, data?: any }
  ```
  Helpers: `successDataHandle(data, message?)`, `successMessageHandle(message)`,
  `errorMessageHandle(message, error?)`.
- **utils/users.ts** exposes `getUserId(req)`, which reads the `userId` the
  global auth middleware already attached to `req.user`.
- **common/placeOrder.ts** holds the real work as a plain async function with no
  HTTP dependency. It:
  1. Validates stock for **every** line *before* writing anything,
  2. Creates the `order` header,
  3. Creates `orderItem` rows and decrements `product.stock`,
  all inside **one DB transaction** so either the whole order succeeds or
  nothing is written (stock is never half-decremented). Both a REST controller
  and a background job can call it.

### Request & response objects

- `req.params` — URL segments (`/products/:id`)
- `req.query` — query string (`?search=foo`)
- `req.body` — JSON payload (parsed by `express.json()` / `body-parser`)
- `req.headers.authorization` — the JWT
- `res.status(200).json({...})` — how you reply

> **This API returns HTTP 200 even on error** and puts the real result in the
> JSON `status_code` field. Clients read `status` / `status_code`, not the HTTP
> number. (The global error handler and auth guard do send real 401/500 status
> codes where appropriate.)

### Middleware & the global auth guard (`src/middleware/auth.ts`)

`authMiddleware` is `(req, res, next)` that runs *before* your handler. It reads
the `Authorization` header (supports `Bearer <token>`), verifies the JWT with
`JWT_SECRET`, and attaches the decoded user to `req.user` before calling
`next()`. A missing or invalid token returns `401`.

It is mounted **once** over every protected route in `index.ts`:

```ts
app.use("/v1", shopPublic);                       // public (no guard)
app.use("/v1", authMiddleware, shop);             // every route needs a token
```

Because auth runs first, controllers never have to remember the check, and
`req.user` is guaranteed to exist inside protected handlers. Less duplication,
fewer open endpoints.

**The one public exception:** `POST /v1/login` is mounted on `shopPublic`
(without the guard). It mints a demo JWT via `signToken` (`jsonwebtoken`,
7-day expiry). In a real app you would verify a password against the DB here.

### Linting

ESLint reads `eslint.config.mjs` and flags style / bug problems. `eslint src
--fix` auto-fixes what it can. Because `build = lint && tsc`, a lint failure
fails the build, so bad style can't reach production. Run `npm run lint` any
time.

---

## API reference

All routes are mounted under `/v1`.

| Method | Path             | Auth | Handler                  | Description                          |
| ------ | ---------------- | ---- | ------------------------ | ------------------------------------ |
| POST   | `/v1/login`      | No   | `login`                  | Exchange `{ userId, email? }` for a JWT |
| GET    | `/v1/products`   | Yes  | `listProducts`           | List products, optional `?search=`  |
| GET    | `/v1/products/:id` | Yes | `getProduct`             | Get one product                      |
| POST   | `/v1/products`   | Yes  | `createProduct`          | Create product `{ name, price, stock? }` |
| POST   | `/v1/orders`     | Yes  | `createOrder`            | Place order `{ lines: [{ productId, quantity }] }` |
| GET    | `/v1/orders/:id` | Yes  | `getOrder`               | Get order + its line items           |

### Example: get a token, then place an order

```bash
# 1) Get a demo token (public)
curl -X POST http://localhost:8080/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"userId": 1, "email": "demo@example.com"}'
# -> { "status": true, "code": "SUCCESS", "data": { "token": "eyJ..." } }

# 2) Use it to place an order (protected)
curl -X POST http://localhost:8080/v1/orders \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJ...' \
  -d '{"lines": [{"productId": 1, "quantity": 2}]}'
```

Every response uses the same envelope:

```json
{
  "status": true,
  "status_code": 200,
  "code": "SUCCESS",
  "message": "Order placed",
  "data": { "order": { ... }, "items": [ ... ] }
}
```

---

## Run vs build

| Stage     | Command              | What it does                                                        |
| --------- | -------------------- | ------------------------------------------------------------------- |
| Write     | `npm run start`      | `nodemon --exec ts-node src/index.ts` — runs TS directly, reloads on save. Best while coding. |
| Check     | `npm run build`      | `npm run lint && tsc` — ESLint first, then the compiler emits JS into `dist/`. |
| Ship      | `npm run start:prod` | `node dist/index.js` — serves the compiled output. Use in Docker / prod. |

Mental model: **write** in TS with nodemon → **check** with lint+tsc (build) →
**ship** compiled `dist/` in Docker. The `.ts` files are source; `dist/` is what
actually runs.

### Production (Docker)

A two-stage build installs + compiles in stage 1, then copies only `dist/` and
production packages into stage 2 and runs as a non-root `node` user — small, safe
image. (Add the `Dockerfile` in this repo when you dockerize; the build command
above already produces the `dist/` it needs.)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # -> dist/

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
USER node
CMD ["node", "dist/index.js"]
```

---

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run start`     | Dev server with hot reload (ts-node).    |
| `npm run build`     | Lint then compile to `dist/`.            |
| `npm run start:prod`| Run the compiled `dist/index.js`.        |
| `npm run lint`      | ESLint `src --fix`.                      |

---

## Notes

- This is a **learning example**: `POST /v1/login` issues a token without
  checking a password, and `sync({ alter: true })` manages schema automatically.
  Replace both with real auth + migrations before production use.
- The response envelope shape (`{ status, status_code, code, message, data }`)
  is the contract that makes the API predictable to consume — keep it uniform
  across every endpoint.
