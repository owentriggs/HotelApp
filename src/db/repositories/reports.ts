import { getDb } from "../index";
import type { OccupancyReport, RevenueReport } from "../../shared/types";

export function revenueReport(dateFrom: string, dateTo: string): RevenueReport {
  const db = getDb();
  const byType = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount_cents), 0) as total
       FROM folio_charges
       WHERE date(created_at) BETWEEN date(?) AND date(?)
       GROUP BY type`
    )
    .all(dateFrom, dateTo) as { type: string; total: number }[];

  const totals: Record<string, number> = { room: 0, food: 0, service: 0, adjustment: 0 };
  for (const row of byType) totals[row.type] = row.total;

  const paymentsByMethod = db
    .prepare(
      `SELECT method, COALESCE(SUM(amount_cents), 0) as total
       FROM payments
       WHERE date(created_at) BETWEEN date(?) AND date(?)
       GROUP BY method`
    )
    .all(dateFrom, dateTo) as { method: string; total: number }[];

  return {
    roomCents: totals.room,
    foodCents: totals.food,
    serviceCents: totals.service,
    adjustmentCents: totals.adjustment,
    totalCents: totals.room + totals.food + totals.service + totals.adjustment,
    paymentsByMethod: paymentsByMethod.map((p) => ({ method: p.method, amountCents: p.total })),
  };
}

export function occupancyReport(dateFrom: string, dateTo: string): OccupancyReport {
  const db = getDb();
  const roomCount = (db.prepare("SELECT COUNT(*) as c FROM rooms").get() as { c: number }).c;
  const nights = Math.max(
    1,
    Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalRoomNights = roomCount * nights;

  // Sum, per booking overlapping the range, the number of nights that fall inside [dateFrom, dateTo).
  const bookings = db
    .prepare(
      `SELECT check_in_date, check_out_date FROM bookings
       WHERE status NOT IN ('cancelled', 'no_show')
         AND check_in_date < ? AND check_out_date > ?`
    )
    .all(dateTo, dateFrom) as { check_in_date: string; check_out_date: string }[];

  let bookedRoomNights = 0;
  const rangeStart = new Date(dateFrom).getTime();
  const rangeEnd = new Date(dateTo).getTime();
  for (const b of bookings) {
    const start = Math.max(new Date(b.check_in_date).getTime(), rangeStart);
    const end = Math.min(new Date(b.check_out_date).getTime(), rangeEnd);
    bookedRoomNights += Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }

  return {
    totalRoomNights,
    bookedRoomNights,
    occupancyPct: totalRoomNights === 0 ? 0 : Math.round((bookedRoomNights / totalRoomNights) * 1000) / 10,
  };
}
