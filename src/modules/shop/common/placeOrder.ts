import { Sequelize, Transaction } from "sequelize";
import { product, order, orderItem } from "../models/init-models";

export interface OrderLineInput {
  productId: number;
  quantity: number;
}

export interface PlaceOrderResult {
  order: any;
  items: any[];
}

// Reusable business logic. No HTTP here -> it can be called from a controller,
// a test, or a background job. It runs inside one DB transaction so either the
// whole order succeeds or nothing is written (stock is never half-decremented).
export const placeOrder = async (
  userId: number,
  lines: OrderLineInput[],
  sequelize: Sequelize = (product.sequelize as Sequelize),
): Promise<PlaceOrderResult> => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Order must contain at least one line item");
  }

  return sequelize.transaction(async (t: Transaction) => {
    let total = 0;

    // 1) Validate stock for every line BEFORE writing anything.
    const items: any[] = [];
    for (const line of lines) {
      const p = await product.findByPk(line.productId, { transaction: t });
      if (!p) throw new Error(`Product ${line.productId} not found`);
      const available = Number(p.stock ?? 0);
      if (available < line.quantity) {
        throw new Error(
          `Insufficient stock for ${p.name}: have ${available}, need ${line.quantity}`,
        );
      }
      items.push({
        productId: p.id,
        quantity: line.quantity,
        unitPrice: Number(p.price),
      });
      total += Number(p.price) * line.quantity;
    }

    // 2) Create the order header.
    const newOrder = await order.create(
      { userId, total, status: "pending" },
      { transaction: t },
    );

    // 3) Create line items + decrement stock.
    for (const item of items) {
      await orderItem.create(
        { ...item, orderId: newOrder.id },
        { transaction: t },
      );
      await product.decrement("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction: t,
      });
    }

    return { order: newOrder, items: await orderItem.findAll({
      where: { orderId: newOrder.id },
      transaction: t,
    }) };
  });
};
