import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface orderAttributes {
  id: number;
  userId: number;
  total: number;
  status?: "pending" | "paid" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

export type orderOptionalAttributes =
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt";
export type orderCreationAttributes = Optional<
  orderAttributes,
  orderOptionalAttributes
>;

export class order
  extends Model<orderAttributes, orderCreationAttributes>
  implements orderAttributes
{
  declare id: number;
  declare userId: number;
  declare total: number;
  declare status?: "pending" | "paid" | "cancelled";
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof order {
    return order.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        status: {
          type: DataTypes.ENUM("pending", "paid", "cancelled"),
          allowNull: true,
          defaultValue: "pending",
        },
      },
      {
        sequelize,
        tableName: "order",
        timestamps: true,
      },
    );
  }
}
