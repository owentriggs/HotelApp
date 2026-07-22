import { getDb } from "../index";
import type { Guest } from "../../shared/types";

interface GuestRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  address: string | null;
  notes: string | null;
  vip: number;
  blacklisted: number;
  created_at: string;
}

function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    idNumber: row.id_number,
    address: row.address,
    notes: row.notes,
    vip: !!row.vip,
    blacklisted: !!row.blacklisted,
    createdAt: row.created_at,
  };
}

export function listGuests(search?: string): Guest[] {
  const db = getDb();
  const rows = search
    ? (db
        .prepare(
          "SELECT * FROM guests WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name"
        )
        .all(`%${search}%`, `%${search}%`, `%${search}%`) as GuestRow[])
    : (db.prepare("SELECT * FROM guests ORDER BY name").all() as GuestRow[]);
  return rows.map(toGuest);
}

export function getGuest(id: number): Guest | undefined {
  const row = getDb().prepare("SELECT * FROM guests WHERE id = ?").get(id) as
    | GuestRow
    | undefined;
  return row ? toGuest(row) : undefined;
}

export function createGuest(input: Omit<Guest, "id" | "createdAt">): Guest {
  const result = getDb()
    .prepare(
      "INSERT INTO guests (name, email, phone, id_number, address, notes, vip, blacklisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      input.name,
      input.email,
      input.phone,
      input.idNumber,
      input.address,
      input.notes,
      input.vip ? 1 : 0,
      input.blacklisted ? 1 : 0
    );
  return getGuest(Number(result.lastInsertRowid))!;
}

export function updateGuest(id: number, input: Omit<Guest, "id" | "createdAt">): Guest {
  getDb()
    .prepare(
      "UPDATE guests SET name = ?, email = ?, phone = ?, id_number = ?, address = ?, notes = ?, vip = ?, blacklisted = ? WHERE id = ?"
    )
    .run(
      input.name,
      input.email,
      input.phone,
      input.idNumber,
      input.address,
      input.notes,
      input.vip ? 1 : 0,
      input.blacklisted ? 1 : 0,
      id
    );
  return getGuest(id)!;
}

export function deleteGuest(id: number): void {
  getDb().prepare("DELETE FROM guests WHERE id = ?").run(id);
}
