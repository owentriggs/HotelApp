import { getDb } from "../index";
import type { MenuCategory, MenuItem } from "../../shared/types";

interface MenuCategoryRow {
  id: number;
  name: string;
  sort_order: number;
}

function toCategory(row: MenuCategoryRow): MenuCategory {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

export function listMenuCategories(): MenuCategory[] {
  const rows = getDb().prepare("SELECT * FROM menu_categories ORDER BY sort_order, name").all() as MenuCategoryRow[];
  return rows.map(toCategory);
}

export function createMenuCategory(name: string, sortOrder: number): MenuCategory {
  const result = getDb()
    .prepare("INSERT INTO menu_categories (name, sort_order) VALUES (?, ?)")
    .run(name, sortOrder);
  return { id: Number(result.lastInsertRowid), name, sortOrder };
}

export function deleteMenuCategory(id: number): void {
  getDb().prepare("DELETE FROM menu_categories WHERE id = ?").run(id);
}

interface MenuItemRow {
  id: number;
  category_id: number;
  name: string;
  price_cents: number;
  tax_rate_id: number | null;
  active: number;
}

function toItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    priceCents: row.price_cents,
    taxRateId: row.tax_rate_id,
    active: !!row.active,
  };
}

export function listMenuItems(): MenuItem[] {
  const rows = getDb().prepare("SELECT * FROM menu_items ORDER BY name").all() as MenuItemRow[];
  return rows.map(toItem);
}

export function createMenuItem(input: Omit<MenuItem, "id">): MenuItem {
  const result = getDb()
    .prepare(
      "INSERT INTO menu_items (category_id, name, price_cents, tax_rate_id, active) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.categoryId, input.name, input.priceCents, input.taxRateId, input.active ? 1 : 0);
  return { id: Number(result.lastInsertRowid), ...input };
}

export function updateMenuItem(id: number, input: Omit<MenuItem, "id">): MenuItem {
  getDb()
    .prepare(
      "UPDATE menu_items SET category_id = ?, name = ?, price_cents = ?, tax_rate_id = ?, active = ? WHERE id = ?"
    )
    .run(input.categoryId, input.name, input.priceCents, input.taxRateId, input.active ? 1 : 0, id);
  return { id, ...input };
}

export function deleteMenuItem(id: number): void {
  getDb().prepare("DELETE FROM menu_items WHERE id = ?").run(id);
}
