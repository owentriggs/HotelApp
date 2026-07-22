import { getDb } from "../index";
import type { RoomType } from "../../shared/types";

interface RoomTypeRow {
  id: number;
  name: string;
  description: string | null;
  base_rate_cents: number;
  max_occupancy: number;
  amenities: string | null;
}

function toRoomType(row: RoomTypeRow): RoomType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baseRateCents: row.base_rate_cents,
    maxOccupancy: row.max_occupancy,
    amenities: row.amenities,
  };
}

export function listRoomTypes(): RoomType[] {
  const rows = getDb().prepare("SELECT * FROM room_types ORDER BY name").all() as RoomTypeRow[];
  return rows.map(toRoomType);
}

export function getRoomType(id: number): RoomType | undefined {
  const row = getDb().prepare("SELECT * FROM room_types WHERE id = ?").get(id) as
    | RoomTypeRow
    | undefined;
  return row ? toRoomType(row) : undefined;
}

export function createRoomType(input: Omit<RoomType, "id">): RoomType {
  const result = getDb()
    .prepare(
      "INSERT INTO room_types (name, description, base_rate_cents, max_occupancy, amenities) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.name, input.description, input.baseRateCents, input.maxOccupancy, input.amenities);
  return getRoomType(Number(result.lastInsertRowid))!;
}

export function updateRoomType(id: number, input: Omit<RoomType, "id">): RoomType {
  getDb()
    .prepare(
      "UPDATE room_types SET name = ?, description = ?, base_rate_cents = ?, max_occupancy = ?, amenities = ? WHERE id = ?"
    )
    .run(input.name, input.description, input.baseRateCents, input.maxOccupancy, input.amenities, id);
  return getRoomType(id)!;
}

export function deleteRoomType(id: number): void {
  getDb().prepare("DELETE FROM room_types WHERE id = ?").run(id);
}
