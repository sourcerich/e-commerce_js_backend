import type { Sequelize } from "sequelize";
import { product as _product } from "./product";
import { order as _order } from "./order";
import { orderItem as _orderItem } from "./orderItem";
import type { productAttributes, productCreationAttributes } from "./product";
import type { orderAttributes, orderCreationAttributes } from "./order";
import type {
  orderItemAttributes,
  orderItemCreationAttributes,
} from "./orderItem";

export {
  _product as product,
  _order as order,
  _orderItem as orderItem,
};

export type {
  productAttributes,
  productCreationAttributes,
  orderAttributes,
  orderCreationAttributes,
  orderItemAttributes,
  orderItemCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const product = _product.initModel(sequelize);
  const order = _order.initModel(sequelize);
  const orderItem = _orderItem.initModel(sequelize);

  // Associations (so you can do order.getOrderItems() etc.):
  order.hasMany(orderItem, { foreignKey: "orderId", as: "items" });
  orderItem.belongsTo(order, { foreignKey: "orderId" });
  orderItem.belongsTo(product, { foreignKey: "productId" });

  return {
    product,
    order,
    orderItem,
  };
}
