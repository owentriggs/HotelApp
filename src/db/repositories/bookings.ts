import { getDb } from "../index";
import { nextNumber } from "./numbering";
import { updateRoomStatus } from "./rooms";
import type { Booking, BookingStatus, ChargeType, FolioCharge } from "../../shared/types";

interface BookingRow {
  id: number;
  booking_number: string;
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  actual_check_in_at: string | null;
  actual_check_out_at: string | null;
  status: BookingStatus;
  rate_cents: number;
  adults: number;
  children: number;
  source: string | null;
  notes: string | null;
  created_at: string;
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    bookingNumber: row.booking_number,
    guestId: row.guest_id,
    roomId: row.room_id,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    actualCheckInAt: row.actual_check_in_at,
    actualCheckOutAt: row.actual_check_out_at,
    status: row.status,
    rateCents: row.rate_cents,
    adults: row.adults,
    children: row.children,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function listBookings(): Booking[] {
  const rows = getDb()
    .prepare("SELECT * FROM bookings ORDER BY check_in_date")
    .all() as BookingRow[];
  return rows.map(toBooking);
}

export function listCheckedInBookings(): Booking[] {
  const rows = getDb()
    .prepare("SELECT * FROM bookings WHERE status = 'checked_in' ORDER BY room_id")
    .all() as BookingRow[];
  return rows.map(toBooking);
}

export function getBooking(id: number): Booking | undefined {
  const row = getDb().prepare("SELECT * FROM bookings WHERE id = ?").get(id) as
    | BookingRow
    | undefined;
  return row ? toBooking(row) : undefined;
}

// Active bookings (not cancelled/no-show) whose stay overlaps [checkInDate, checkOutDate) for a room.
export function isRoomAvailable(
  roomId: number,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId?: number
): boolean {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as c FROM bookings
       WHERE room_id = ?
         AND status NOT IN ('cancelled', 'no_show', 'checked_out')
         AND check_in_date < ?
         AND check_out_date > ?
         AND (? IS NULL OR id != ?)`
    )
    .get(roomId, checkOutDate, checkInDate, excludeBookingId ?? null, excludeBookingId ?? null) as {
    c: number;
  };
  return row.c === 0;
}

export function createBooking(
  input: Omit<Booking, "id" | "bookingNumber" | "status" | "actualCheckInAt" | "actualCheckOutAt" | "createdAt">
): Booking {
  const bookingNumber = nextNumber("booking");
  const result = getDb()
    .prepare(
      `INSERT INTO bookings
        (booking_number, guest_id, room_id, check_in_date, check_out_date, status, rate_cents, adults, children, source, notes)
       VALUES (?, ?, ?, ?, ?, 'booked', ?, ?, ?, ?, ?)`
    )
    .run(
      bookingNumber,
      input.guestId,
      input.roomId,
      input.checkInDate,
      input.checkOutDate,
      input.rateCents,
      input.adults,
      input.children,
      input.source,
      input.notes
    );
  const booking = getBooking(Number(result.lastInsertRowid))!;
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  addFolioCharge(
    booking.id,
    "room",
    `Room charge (${nights} night${nights === 1 ? "" : "s"})`,
    nights * booking.rateCents,
    null
  );
  return booking;
}

function nightsBetween(checkInDate: string, checkOutDate: string): number {
  const ms = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function cancelBooking(id: number): Booking {
  getDb().prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
  return getBooking(id)!;
}

export function checkIn(id: number): Booking {
  const booking = getBooking(id);
  if (!booking) throw new Error("Booking not found");
  getDb()
    .prepare(
      "UPDATE bookings SET status = 'checked_in', actual_check_in_at = datetime('now') WHERE id = ?"
    )
    .run(id);
  updateRoomStatus(booking.roomId, "occupied");
  return getBooking(id)!;
}

export function checkOut(id: number): Booking {
  const booking = getBooking(id);
  if (!booking) throw new Error("Booking not found");
  getDb()
    .prepare(
      "UPDATE bookings SET status = 'checked_out', actual_check_out_at = datetime('now') WHERE id = ?"
    )
    .run(id);
  updateRoomStatus(booking.roomId, "dirty");
  return getBooking(id)!;
}

interface FolioChargeRow {
  id: number;
  booking_id: number;
  type: ChargeType;
  description: string;
  amount_cents: number;
  created_at: string;
  created_by: number | null;
}

function toFolioCharge(row: FolioChargeRow): FolioCharge {
  return {
    id: row.id,
    bookingId: row.booking_id,
    type: row.type,
    description: row.description,
    amountCents: row.amount_cents,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function listFolioCharges(bookingId: number): FolioCharge[] {
  const rows = getDb()
    .prepare("SELECT * FROM folio_charges WHERE booking_id = ? ORDER BY created_at")
    .all(bookingId) as FolioChargeRow[];
  return rows.map(toFolioCharge);
}

export function addFolioCharge(
  bookingId: number,
  type: ChargeType,
  description: string,
  amountCents: number,
  createdBy: number | null
): FolioCharge {
  const result = getDb()
    .prepare(
      "INSERT INTO folio_charges (booking_id, type, description, amount_cents, created_by) VALUES (?, ?, ?, ?, ?)"
    )
    .run(bookingId, type, description, amountCents, createdBy);
  const row = getDb()
    .prepare("SELECT * FROM folio_charges WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as FolioChargeRow;
  return toFolioCharge(row);
}

export function folioTotalCents(bookingId: number): number {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(amount_cents), 0) as total FROM folio_charges WHERE booking_id = ?")
    .get(bookingId) as { total: number };
  return row.total;
}
