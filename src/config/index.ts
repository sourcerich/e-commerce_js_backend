import { Sequelize, Dialect } from "sequelize";
import { dbConfig } from "./db.config";
import { initModels } from "../modules/shop/models/init-models";

export const sequelizeDB = new Sequelize(
  dbConfig.DB || "",
  dbConfig.USER || "",
  dbConfig.PASSWORD || "",
  {
    host: dbConfig.HOST,
    port: Number(dbConfig.PORT),
    dialect: dbConfig.dialect as Dialect,
    dialectOptions: {
      multipleStatements: true,
      charset: "utf8mb4_general_ci",
    },
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
    logging: false,
  },
);

// Bind every model to this connection. Controllers import models from
// init-models (never the raw model file) so they are always initialized.
initModels(sequelizeDB);
