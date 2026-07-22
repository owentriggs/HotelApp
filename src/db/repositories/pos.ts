import { getDb } from "../index";
import { nextNumber } from "./numbering";
import { addFolioCharge } from "./bookings";
import type { PosOrder, PosOrderItem, PosOrderStatus } from "../../shared/types";

interface PosOrderRow {
  id: number;
  order_number: string;
  table_id: number | null;
  booking_id: number | null;
  status: PosOrderStatus;
  created_at: string;
}

function toOrder(row: PosOrderRow): PosOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    tableId: row.table_id,
    bookingId: row.booking_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function listOpenOrders(): PosOrder[] {
  const rows = getDb()
    .prepare("SELECT * FROM pos_orders WHERE status = 'open' ORDER BY created_at")
    .all() as PosOrderRow[];
  return rows.map(toOrder);
}

export function createOrder(tableId: number | null): PosOrder {
  const orderNumber = nextNumber("pos_receipt");
  const result = getDb()
    .prepare("INSERT INTO pos_orders (order_number, table_id, status) VALUES (?, ?, 'open')")
    .run(orderNumber, tableId);
  const row = getDb()
    .prepare("SELECT * FROM pos_orders WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as PosOrderRow;
  return toOrder(row);
}

interface PosOrderItemRow {
  id: number;
  order_id: number;
  menu_item_id: number;
  qty: number;
  unit_price_cents: number;
  notes: string | null;
}

function toOrderItem(row: PosOrderItemRow): PosOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    menuItemId: row.menu_item_id,
    qty: row.qty,
    unitPriceCents: row.unit_price_cents,
    notes: row.notes,
  };
}

export function listOrderItems(orderId: number): PosOrderItem[] {
  const rows = getDb()
    .prepare("SELECT * FROM pos_order_items WHERE order_id = ?")
    .all(orderId) as PosOrderItemRow[];
  return rows.map(toOrderItem);
}

export function addOrderItem(orderId: number, menuItemId: number, qty: number): PosOrderItem {
  const db = getDb();
  const menuItem = db.prepare("SELECT price_cents FROM menu_items WHERE id = ?").get(menuItemId) as
    | { price_cents: number }
    | undefined;
  if (!menuItem) throw new Error("Menu item not found");

  const existing = db
    .prepare("SELECT * FROM pos_order_items WHERE order_id = ? AND menu_item_id = ?")
    .get(orderId, menuItemId) as PosOrderItemRow | undefined;

  if (existing) {
    db.prepare("UPDATE pos_order_items SET qty = qty + ? WHERE id = ?").run(qty, existing.id);
    const row = db.prepare("SELECT * FROM pos_order_items WHERE id = ?").get(existing.id) as PosOrderItemRow;
    return toOrderItem(row);
  }

  const result = db
    .prepare(
      "INSERT INTO pos_order_items (order_id, menu_item_id, qty, unit_price_cents) VALUES (?, ?, ?, ?)"
    )
    .run(orderId, menuItemId, qty, menuItem.price_cents);
  const row = db
    .prepare("SELECT * FROM pos_order_items WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as PosOrderItemRow;
  return toOrderItem(row);
}

export function removeOrderItem(itemId: number): void {
  getDb().prepare("DELETE FROM pos_order_items WHERE id = ?").run(itemId);
}

export function orderTotalCents(orderId: number): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(qty * unit_price_cents), 0) as total FROM pos_order_items WHERE order_id = ?"
    )
    .get(orderId) as { total: number };
  return row.total;
}

export function voidOrder(orderId: number): void {
  getDb().prepare("UPDATE pos_orders SET status = 'void' WHERE id = ?").run(orderId);
}

export function checkoutWithPayment(orderId: number, method: string): void {
  const db = getDb();
  const total = orderTotalCents(orderId);
  db.prepare(
    "INSERT INTO payments (pos_order_id, method, amount_cents) VALUES (?, ?, ?)"
  ).run(orderId, method, total);
  db.prepare("UPDATE pos_orders SET status = 'paid' WHERE id = ?").run(orderId);
}

export function checkoutToRoom(orderId: number, bookingId: number): void {
  const db = getDb();
  const total = orderTotalCents(orderId);
  addFolioCharge(bookingId, "food", `POS order`, total, null);
  db.prepare("UPDATE pos_orders SET status = 'paid', booking_id = ? WHERE id = ?").run(bookingId, orderId);
}
