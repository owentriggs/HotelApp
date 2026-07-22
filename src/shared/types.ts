// Shared types between main (db/IPC) and renderer. Money values are always integer minor units (cents).

export type UserRole = "admin" | "manager" | "front_desk" | "pos_staff";

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export type RoomStatus = "vacant" | "occupied" | "dirty" | "clean" | "maintenance" | "out_of_order";

export interface RoomType {
  id: number;
  name: string;
  description: string | null;
  baseRateCents: number;
  maxOccupancy: number;
  amenities: string | null;
}

export interface Room {
  id: number;
  number: string;
  roomTypeId: number;
  floor: string | null;
  status: RoomStatus;
  notes: string | null;
}

export interface Guest {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  address: string | null;
  notes: string | null;
  vip: boolean;
  blacklisted: boolean;
  createdAt: string;
}

export type BookingStatus = "booked" | "checked_in" | "checked_out" | "cancelled" | "no_show";

export interface Booking {
  id: number;
  bookingNumber: string;
  guestId: number;
  roomId: number;
  checkInDate: string; // ISO date
  checkOutDate: string; // ISO date
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  status: BookingStatus;
  rateCents: number;
  adults: number;
  children: number;
  source: string | null;
  notes: string | null;
  createdAt: string;
}

export type ChargeType = "room" | "food" | "service" | "adjustment";

export interface FolioCharge {
  id: number;
  bookingId: number;
  type: ChargeType;
  description: string;
  amountCents: number;
  createdAt: string;
  createdBy: number | null;
}

export interface Payment {
  id: number;
  bookingId: number | null;
  posOrderId: number | null;
  method: string;
  amountCents: number;
  reference: string | null;
  createdAt: string;
  createdBy: number | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  priceCents: number;
  taxRateId: number | null;
  active: boolean;
}

export type PosOrderStatus = "open" | "paid" | "void";

export interface PosOrder {
  id: number;
  orderNumber: string;
  tableId: number | null;
  bookingId: number | null;
  status: PosOrderStatus;
  createdAt: string;
}

export interface PosOrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  qty: number;
  unitPriceCents: number;
  notes: string | null;
}

export interface Currency {
  code: string;
  symbol: string;
  isBase: boolean;
  exchangeRate: number;
}

export interface TaxRate {
  id: number;
  name: string;
  percentage: number;
  appliesTo: "rooms" | "pos" | "both";
}

export type NumberingResetRule = "never" | "yearly" | "monthly";

export interface NumberingSequence {
  key: string;
  prefix: string;
  nextValue: number;
  padding: number;
  resetRule: NumberingResetRule;
  lastResetPeriod: string | null;
}

export interface RevenueReport {
  roomCents: number;
  foodCents: number;
  serviceCents: number;
  adjustmentCents: number;
  totalCents: number;
  paymentsByMethod: { method: string; amountCents: number }[];
}

export interface OccupancyReport {
  totalRoomNights: number;
  bookedRoomNights: number;
  occupancyPct: number;
}

export interface GeneralSettings {
  hotelName: string;
  address: string;
  phone: string;
  email: string;
  defaultCheckInTime: string; // "14:00"
  defaultCheckOutTime: string; // "11:00"
  dateFormat: string;
  theme: "light" | "dark" | "system";
}
