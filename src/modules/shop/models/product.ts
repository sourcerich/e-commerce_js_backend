import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface productAttributes {
  id: number;
  name: string;
  price: number;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// id and timestamps are auto-filled, so they are optional when creating.
export type productOptionalAttributes = "id" | "stock" | "createdAt" | "updatedAt";
export type productCreationAttributes = Optional<
  productAttributes,
  productOptionalAttributes
>;

export class product
  extends Model<productAttributes, productCreationAttributes>
  implements productAttributes
{
  declare id: number;
  declare name: string;
  declare price: number;
  declare stock?: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof product {
    return product.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        name: { type: DataTypes.STRING(255), allowNull: false },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        stock: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      },
      {
        sequelize,
        tableName: "product",
        timestamps: true,
      },
    );
  }
}
