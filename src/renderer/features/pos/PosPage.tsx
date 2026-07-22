import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import { centsToInput, formatCents, inputToCents } from "../../lib/money";
import type { MenuCategory, MenuItem } from "@shared/types";

export default function PosPage() {
  const queryClient = useQueryClient();
  const [showMenuManager, setShowMenuManager] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  const ordersQuery = useQuery(["pos", "openOrders"], () => getApi().pos.listOpenOrders());

  const createOrder = useMutation(() => getApi().pos.createOrder(null), {
    onSuccess: (order) => {
      queryClient.invalidateQueries(["pos", "openOrders"]);
      setActiveOrderId(order.id);
    },
  });

  return (
    <div>
      <div className="toolbar">
        <h2 className="page-title">Point of Sale</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => setShowMenuManager(true)}>
            Manage menu
          </button>
          <button className="btn" onClick={() => createOrder.mutate()}>
            New order
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(ordersQuery.data ?? []).map((o) => (
          <button
            key={o.id}
            className="btn secondary"
            style={{
              background: activeOrderId === o.id ? "var(--accent)" : undefined,
              color: activeOrderId === o.id ? "var(--accent-contrast)" : undefined,
            }}
            onClick={() => setActiveOrderId(o.id)}
          >
            {o.orderNumber}
          </button>
        ))}
        {ordersQuery.data && ordersQuery.data.length === 0 && <p>No open orders. Start a new one.</p>}
      </div>

      {activeOrderId !== null && (
        <OrderScreen orderId={activeOrderId} onClosed={() => setActiveOrderId(null)} />
      )}

      {showMenuManager && <MenuManagerModal onClose={() => setShowMenuManager(false)} />}
    </div>
  );
}

function OrderScreen({ orderId, onClosed }: { orderId: number; onClosed: () => void }) {
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const categoriesQuery = useQuery(["menuCategories"], () => getApi().menuCategories.list());
  const itemsQuery = useQuery(["menuItems"], () => getApi().menuItems.list());
  const orderItemsQuery = useQuery(["pos", "orderItems", orderId], () => getApi().pos.listOrderItems(orderId));

  const categories = categoriesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const category = activeCategoryId ?? categories[0]?.id ?? null;

  const invalidate = () => {
    queryClient.invalidateQueries(["pos", "orderItems", orderId]);
    queryClient.invalidateQueries(["pos", "openOrders"]);
  };

  const addItem = useMutation((menuItemId: number) => getApi().pos.addOrderItem(orderId, menuItemId, 1), {
    onSuccess: invalidate,
  });
  const removeItem = useMutation((itemId: number) => getApi().pos.removeOrderItem(itemId), {
    onSuccess: invalidate,
  });

  const itemsById = new Map<number, MenuItem>(items.map((i) => [i.id, i]));
  const total = (orderItemsQuery.data ?? []).reduce((sum, oi) => sum + oi.qty * oi.unitPriceCents, 0);

  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: 2 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c.id}
              className="btn secondary"
              style={{
                background: category === c.id ? "var(--accent)" : undefined,
                color: category === c.id ? "var(--accent-contrast)" : undefined,
              }}
              onClick={() => setActiveCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="room-grid">
          {items
            .filter((i) => i.active && i.categoryId === category)
            .map((item) => (
              <div key={item.id} className="room-tile vacant" onClick={() => addItem.mutate(item.id)}>
                <strong>{item.name}</strong>
                <div style={{ fontSize: 12 }}>{formatCents(item.priceCents)}</div>
              </div>
            ))}
        </div>
        {categories.length === 0 && <p>No menu categories yet. Use "Manage menu" to add some.</p>}
      </div>

      <div style={{ flex: 1 }} className="card">
        <h4 style={{ marginTop: 0 }}>Ticket</h4>
        {(orderItemsQuery.data ?? []).map((oi) => (
          <div key={oi.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span>
              {oi.qty} &times; {itemsById.get(oi.menuItemId)?.name ?? "?"}
            </span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {formatCents(oi.qty * oi.unitPriceCents)}
              <button className="btn danger" style={{ padding: "2px 6px" }} onClick={() => removeItem.mutate(oi.id)}>
                x
              </button>
            </span>
          </div>
        ))}
        {(orderItemsQuery.data ?? []).length === 0 && <p style={{ fontSize: 13 }}>No items yet.</p>}
        <hr style={{ borderColor: "var(--border)" }} />
        <p style={{ textAlign: "right" }}>
          <strong>Total: {formatCents(total)}</strong>
        </p>
        <button
          className="btn"
          style={{ width: "100%" }}
          disabled={(orderItemsQuery.data ?? []).length === 0}
          onClick={() => setShowCheckout(true)}
        >
          Checkout
        </button>
      </div>

      {showCheckout && (
        <CheckoutModal
          orderId={orderId}
          onClose={() => setShowCheckout(false)}
          onDone={() => {
            setShowCheckout(false);
            onClosed();
            queryClient.invalidateQueries(["pos", "openOrders"]);
          }}
        />
      )}
    </div>
  );
}

function CheckoutModal({
  orderId,
  onClose,
  onDone,
}: {
  orderId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const paymentMethodsQuery = useQuery(["paymentMethods"], () => getApi().settings.getPaymentMethods());
  const checkedInQuery = useQuery(["bookings", "checkedIn"], () => getApi().bookings.listCheckedIn());
  const [mode, setMode] = useState<"payment" | "room">("payment");
  const [method, setMethod] = useState("");
  const [bookingId, setBookingId] = useState<number | "">("");

  const payWithMethod = useMutation(() => getApi().pos.checkoutWithPayment(orderId, method), { onSuccess: onDone });
  const chargeToRoom = useMutation(() => getApi().pos.checkoutToRoom(orderId, Number(bookingId)), {
    onSuccess: onDone,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Checkout</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="btn secondary" style={{ background: mode === "payment" ? "var(--accent)" : undefined }} onClick={() => setMode("payment")}>
            Pay now
          </button>
          <button className="btn secondary" style={{ background: mode === "room" ? "var(--accent)" : undefined }} onClick={() => setMode("room")}>
            Charge to room
          </button>
        </div>

        {mode === "payment" && (
          <div className="form-row">
            <label>Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">Select...</option>
              {(paymentMethodsQuery.data ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === "room" && (
          <div className="form-row">
            <label>In-house booking</label>
            <select value={bookingId} onChange={(e) => setBookingId(Number(e.target.value))}>
              <option value="">Select...</option>
              {(checkedInQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingNumber}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            disabled={mode === "payment" ? !method : !bookingId}
            onClick={() => (mode === "payment" ? payWithMethod.mutate() : chargeToRoom.mutate())}
          >
            Confirm
          </button>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuManagerModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery(["menuCategories"], () => getApi().menuCategories.list());
  const itemsQuery = useQuery(["menuItems"], () => getApi().menuItems.list());

  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("0");
  const [itemCategoryId, setItemCategoryId] = useState<number | "">("");

  const createCategory = useMutation(
    () => getApi().menuCategories.create(categoryName, (categoriesQuery.data ?? []).length),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["menuCategories"]);
        setCategoryName("");
      },
    }
  );
  const deleteCategory = useMutation((id: number) => getApi().menuCategories.delete(id), {
    onSuccess: () => queryClient.invalidateQueries(["menuCategories"]),
  });
  const createItem = useMutation(
    () =>
      getApi().menuItems.create({
        categoryId: Number(itemCategoryId),
        name: itemName,
        priceCents: inputToCents(itemPrice),
        taxRateId: null,
        active: true,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["menuItems"]);
        setItemName("");
        setItemPrice("0");
      },
    }
  );
  const deleteItem = useMutation((id: number) => getApi().menuItems.delete(id), {
    onSuccess: () => queryClient.invalidateQueries(["menuItems"]),
  });

  const categoriesById = new Map<number, MenuCategory>((categoriesQuery.data ?? []).map((c) => [c.id, c]));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <h3>Menu management</h3>

        <h4>Categories</h4>
        {(categoriesQuery.data ?? []).map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{c.name}</span>
            <button className="btn danger" onClick={() => deleteCategory.mutate(c.id)}>
              Delete
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input placeholder="New category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          <button className="btn" disabled={!categoryName} onClick={() => createCategory.mutate()}>
            Add
          </button>
        </div>

        <h4>Items</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(itemsQuery.data ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{categoriesById.get(item.categoryId)?.name ?? "-"}</td>
                <td>{centsToInput(item.priceCents)}</td>
                <td>
                  <button className="btn danger" onClick={() => deleteItem.mutate(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select value={itemCategoryId} onChange={(e) => setItemCategoryId(Number(e.target.value))}>
            <option value="">Category...</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          <input type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ width: 80 }} />
          <button className="btn" disabled={!itemName || !itemCategoryId} onClick={() => createItem.mutate()}>
            Add
          </button>
        </div>

        <button className="btn secondary" style={{ marginTop: 20 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
