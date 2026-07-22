import type {
  Booking,
  ChargeType,
  Currency,
  FolioCharge,
  GeneralSettings,
  Guest,
  MenuCategory,
  MenuItem,
  NumberingSequence,
  OccupancyReport,
  PosOrder,
  PosOrderItem,
  RevenueReport,
  Room,
  RoomStatus,
  RoomType,
  TaxRate,
  User,
  UserRole,
} from "@shared/types";

export interface HotelApi {
  roomTypes: {
    list: () => Promise<RoomType[]>;
    create: (input: Omit<RoomType, "id">) => Promise<RoomType>;
    update: (id: number, input: Omit<RoomType, "id">) => Promise<RoomType>;
    delete: (id: number) => Promise<void>;
  };
  rooms: {
    list: () => Promise<Room[]>;
    create: (input: Omit<Room, "id">) => Promise<Room>;
    update: (id: number, input: Omit<Room, "id">) => Promise<Room>;
    updateStatus: (id: number, status: RoomStatus) => Promise<Room>;
    delete: (id: number) => Promise<void>;
  };
  guests: {
    list: (search?: string) => Promise<Guest[]>;
    create: (input: Omit<Guest, "id" | "createdAt">) => Promise<Guest>;
    update: (id: number, input: Omit<Guest, "id" | "createdAt">) => Promise<Guest>;
    delete: (id: number) => Promise<void>;
  };
  bookings: {
    list: () => Promise<Booking[]>;
    create: (
      input: Omit<
        Booking,
        "id" | "bookingNumber" | "status" | "actualCheckInAt" | "actualCheckOutAt" | "createdAt"
      >
    ) => Promise<Booking>;
    isRoomAvailable: (
      roomId: number,
      checkInDate: string,
      checkOutDate: string,
      excludeBookingId?: number
    ) => Promise<boolean>;
    cancel: (id: number) => Promise<Booking>;
    checkIn: (id: number) => Promise<Booking>;
    checkOut: (id: number) => Promise<Booking>;
    listFolioCharges: (bookingId: number) => Promise<FolioCharge[]>;
    addFolioCharge: (
      bookingId: number,
      type: ChargeType,
      description: string,
      amountCents: number
    ) => Promise<FolioCharge>;
    folioTotal: (bookingId: number) => Promise<number>;
    listCheckedIn: () => Promise<Booking[]>;
  };
  menuCategories: {
    list: () => Promise<MenuCategory[]>;
    create: (name: string, sortOrder: number) => Promise<MenuCategory>;
    delete: (id: number) => Promise<void>;
  };
  menuItems: {
    list: () => Promise<MenuItem[]>;
    create: (input: Omit<MenuItem, "id">) => Promise<MenuItem>;
    update: (id: number, input: Omit<MenuItem, "id">) => Promise<MenuItem>;
    delete: (id: number) => Promise<void>;
  };
  pos: {
    listOpenOrders: () => Promise<PosOrder[]>;
    createOrder: (tableId: number | null) => Promise<PosOrder>;
    listOrderItems: (orderId: number) => Promise<PosOrderItem[]>;
    addOrderItem: (orderId: number, menuItemId: number, qty: number) => Promise<PosOrderItem>;
    removeOrderItem: (itemId: number) => Promise<void>;
    orderTotal: (orderId: number) => Promise<number>;
    voidOrder: (orderId: number) => Promise<void>;
    checkoutWithPayment: (orderId: number, method: string) => Promise<void>;
    checkoutToRoom: (orderId: number, bookingId: number) => Promise<void>;
  };
  settings: {
    getGeneral: () => Promise<GeneralSettings>;
    updateGeneral: (input: GeneralSettings) => Promise<GeneralSettings>;
    getPaymentMethods: () => Promise<string[]>;
    updatePaymentMethods: (methods: string[]) => Promise<string[]>;
  };
  currencies: {
    list: () => Promise<Currency[]>;
    create: (input: Currency) => Promise<Currency>;
    setBase: (code: string) => Promise<void>;
    updateRate: (code: string, rate: number) => Promise<void>;
    delete: (code: string) => Promise<void>;
  };
  taxRates: {
    list: () => Promise<TaxRate[]>;
    create: (input: Omit<TaxRate, "id">) => Promise<TaxRate>;
    update: (id: number, input: Omit<TaxRate, "id">) => Promise<TaxRate>;
    delete: (id: number) => Promise<void>;
  };
  numbering: {
    list: () => Promise<NumberingSequence[]>;
    update: (
      key: string,
      input: Pick<NumberingSequence, "prefix" | "padding" | "resetRule" | "nextValue">
    ) => Promise<NumberingSequence>;
  };
  users: {
    list: () => Promise<User[]>;
    create: (input: { name: string; username: string; password: string; role: UserRole }) => Promise<User>;
    setActive: (id: number, active: boolean) => Promise<void>;
    setRole: (id: number, role: UserRole) => Promise<void>;
    login: (username: string, password: string) => Promise<User | null>;
  };
  backup: {
    getDbPath: () => Promise<string>;
    backupNow: () => Promise<string | null>;
    restore: () => Promise<boolean>;
    revealDbFolder: () => Promise<void>;
  };
  reports: {
    revenue: (dateFrom: string, dateTo: string) => Promise<RevenueReport>;
    occupancy: (dateFrom: string, dateTo: string) => Promise<OccupancyReport>;
    exportCsv: (filename: string, csv: string) => Promise<string | null>;
  };
}

declare global {
  interface Window {
    api: HotelApi;
  }
}

export function getApi(): HotelApi {
  return window.api;
}
