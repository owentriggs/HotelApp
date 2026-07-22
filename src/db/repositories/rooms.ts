import { getDb } from "../index";
import type { Room, RoomStatus } from "../../shared/types";

interface RoomRow {
  id: number;
  number: string;
  room_type_id: number;
  floor: string | null;
  status: RoomStatus;
  notes: string | null;
}

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    number: row.number,
    roomTypeId: row.room_type_id,
    floor: row.floor,
    status: row.status,
    notes: row.notes,
  };
}

export function listRooms(): Room[] {
  const rows = getDb().prepare("SELECT * FROM rooms ORDER BY number").all() as RoomRow[];
  return rows.map(toRoom);
}

export function getRoom(id: number): Room | undefined {
  const row = getDb().prepare("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow | undefined;
  return row ? toRoom(row) : undefined;
}

export function createRoom(input: Omit<Room, "id">): Room {
  const result = getDb()
    .prepare(
      "INSERT INTO rooms (number, room_type_id, floor, status, notes) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.number, input.roomTypeId, input.floor, input.status, input.notes);
  return getRoom(Number(result.lastInsertRowid))!;
}

export function updateRoom(id: number, input: Omit<Room, "id">): Room {
  getDb()
    .prepare(
      "UPDATE rooms SET number = ?, room_type_id = ?, floor = ?, status = ?, notes = ? WHERE id = ?"
    )
    .run(input.number, input.roomTypeId, input.floor, input.status, input.notes, id);
  return getRoom(id)!;
}

export function updateRoomStatus(id: number, status: RoomStatus): Room {
  getDb().prepare("UPDATE rooms SET status = ? WHERE id = ?").run(status, id);
  return getRoom(id)!;
}

export function deleteRoom(id: number): void {
  getDb().prepare("DELETE FROM rooms WHERE id = ?").run(id);
}
