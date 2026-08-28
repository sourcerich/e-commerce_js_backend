import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface orderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type orderItemOptionalAttributes =
  | "id"
  | "createdAt"
  | "updatedAt";
export type orderItemCreationAttributes = Optional<
  orderItemAttributes,
  orderItemOptionalAttributes
>;

export class orderItem
  extends Model<orderItemAttributes, orderItemCreationAttributes>
  implements orderItemAttributes
{
  declare id: number;
  declare orderId: number;
  declare productId: number;
  declare quantity: number;
  declare unitPrice: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof orderItem {
    return orderItem.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        orderId: { type: DataTypes.INTEGER, allowNull: false },
        productId: { type: DataTypes.INTEGER, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      },
      {
        sequelize,
        tableName: "orderItem",
        timestamps: true,
      },
    );
  }
}
