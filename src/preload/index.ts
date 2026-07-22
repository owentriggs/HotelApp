import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc";
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
  PosOrder,
  PosOrderItem,
  Room,
  RoomStatus,
  RoomType,
  TaxRate,
  OccupancyReport,
  RevenueReport,
  User,
  UserRole,
} from "../shared/types";

const api = {
  roomTypes: {
    list: (): Promise<RoomType[]> => ipcRenderer.invoke(IPC.roomTypes.list),
    create: (input: Omit<RoomType, "id">): Promise<RoomType> =>
      ipcRenderer.invoke(IPC.roomTypes.create, input),
    update: (id: number, input: Omit<RoomType, "id">): Promise<RoomType> =>
      ipcRenderer.invoke(IPC.roomTypes.update, id, input),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.roomTypes.delete, id),
  },
  rooms: {
    list: (): Promise<Room[]> => ipcRenderer.invoke(IPC.rooms.list),
    create: (input: Omit<Room, "id">): Promise<Room> => ipcRenderer.invoke(IPC.rooms.create, input),
    update: (id: number, input: Omit<Room, "id">): Promise<Room> =>
      ipcRenderer.invoke(IPC.rooms.update, id, input),
    updateStatus: (id: number, status: RoomStatus): Promise<Room> =>
      ipcRenderer.invoke(IPC.rooms.updateStatus, id, status),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.rooms.delete, id),
  },
  guests: {
    list: (search?: string): Promise<Guest[]> => ipcRenderer.invoke(IPC.guests.list, search),
    create: (input: Omit<Guest, "id" | "createdAt">): Promise<Guest> =>
      ipcRenderer.invoke(IPC.guests.create, input),
    update: (id: number, input: Omit<Guest, "id" | "createdAt">): Promise<Guest> =>
      ipcRenderer.invoke(IPC.guests.update, id, input),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.guests.delete, id),
  },
  bookings: {
    list: (): Promise<Booking[]> => ipcRenderer.invoke(IPC.bookings.list),
    create: (
      input: Omit<
        Booking,
        "id" | "bookingNumber" | "status" | "actualCheckInAt" | "actualCheckOutAt" | "createdAt"
      >
    ): Promise<Booking> => ipcRenderer.invoke(IPC.bookings.create, input),
    isRoomAvailable: (
      roomId: number,
      checkInDate: string,
      checkOutDate: string,
      excludeBookingId?: number
    ): Promise<boolean> =>
      ipcRenderer.invoke(IPC.bookings.isRoomAvailable, roomId, checkInDate, checkOutDate, excludeBookingId),
    cancel: (id: number): Promise<Booking> => ipcRenderer.invoke(IPC.bookings.cancel, id),
    checkIn: (id: number): Promise<Booking> => ipcRenderer.invoke(IPC.bookings.checkIn, id),
    checkOut: (id: number): Promise<Booking> => ipcRenderer.invoke(IPC.bookings.checkOut, id),
    listFolioCharges: (bookingId: number): Promise<FolioCharge[]> =>
      ipcRenderer.invoke(IPC.bookings.listFolioCharges, bookingId),
    addFolioCharge: (
      bookingId: number,
      type: ChargeType,
      description: string,
      amountCents: number
    ): Promise<FolioCharge> =>
      ipcRenderer.invoke(IPC.bookings.addFolioCharge, bookingId, type, description, amountCents),
    folioTotal: (bookingId: number): Promise<number> =>
      ipcRenderer.invoke(IPC.bookings.folioTotal, bookingId),
    listCheckedIn: (): Promise<Booking[]> => ipcRenderer.invoke(IPC.bookings.listCheckedIn),
  },
  menuCategories: {
    list: (): Promise<MenuCategory[]> => ipcRenderer.invoke(IPC.menuCategories.list),
    create: (name: string, sortOrder: number): Promise<MenuCategory> =>
      ipcRenderer.invoke(IPC.menuCategories.create, name, sortOrder),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.menuCategories.delete, id),
  },
  menuItems: {
    list: (): Promise<MenuItem[]> => ipcRenderer.invoke(IPC.menuItems.list),
    create: (input: Omit<MenuItem, "id">): Promise<MenuItem> =>
      ipcRenderer.invoke(IPC.menuItems.create, input),
    update: (id: number, input: Omit<MenuItem, "id">): Promise<MenuItem> =>
      ipcRenderer.invoke(IPC.menuItems.update, id, input),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.menuItems.delete, id),
  },
  pos: {
    listOpenOrders: (): Promise<PosOrder[]> => ipcRenderer.invoke(IPC.pos.listOpenOrders),
    createOrder: (tableId: number | null): Promise<PosOrder> =>
      ipcRenderer.invoke(IPC.pos.createOrder, tableId),
    listOrderItems: (orderId: number): Promise<PosOrderItem[]> =>
      ipcRenderer.invoke(IPC.pos.listOrderItems, orderId),
    addOrderItem: (orderId: number, menuItemId: number, qty: number): Promise<PosOrderItem> =>
      ipcRenderer.invoke(IPC.pos.addOrderItem, orderId, menuItemId, qty),
    removeOrderItem: (itemId: number): Promise<void> =>
      ipcRenderer.invoke(IPC.pos.removeOrderItem, itemId),
    orderTotal: (orderId: number): Promise<number> => ipcRenderer.invoke(IPC.pos.orderTotal, orderId),
    voidOrder: (orderId: number): Promise<void> => ipcRenderer.invoke(IPC.pos.voidOrder, orderId),
    checkoutWithPayment: (orderId: number, method: string): Promise<void> =>
      ipcRenderer.invoke(IPC.pos.checkoutWithPayment, orderId, method),
    checkoutToRoom: (orderId: number, bookingId: number): Promise<void> =>
      ipcRenderer.invoke(IPC.pos.checkoutToRoom, orderId, bookingId),
  },
  settings: {
    getGeneral: (): Promise<GeneralSettings> => ipcRenderer.invoke(IPC.settings.getGeneral),
    updateGeneral: (input: GeneralSettings): Promise<GeneralSettings> =>
      ipcRenderer.invoke(IPC.settings.updateGeneral, input),
    getPaymentMethods: (): Promise<string[]> => ipcRenderer.invoke(IPC.settings.getPaymentMethods),
    updatePaymentMethods: (methods: string[]): Promise<string[]> =>
      ipcRenderer.invoke(IPC.settings.updatePaymentMethods, methods),
  },
  currencies: {
    list: (): Promise<Currency[]> => ipcRenderer.invoke(IPC.currencies.list),
    create: (input: Currency): Promise<Currency> => ipcRenderer.invoke(IPC.currencies.create, input),
    setBase: (code: string): Promise<void> => ipcRenderer.invoke(IPC.currencies.setBase, code),
    updateRate: (code: string, rate: number): Promise<void> =>
      ipcRenderer.invoke(IPC.currencies.updateRate, code, rate),
    delete: (code: string): Promise<void> => ipcRenderer.invoke(IPC.currencies.delete, code),
  },
  taxRates: {
    list: (): Promise<TaxRate[]> => ipcRenderer.invoke(IPC.taxRates.list),
    create: (input: Omit<TaxRate, "id">): Promise<TaxRate> =>
      ipcRenderer.invoke(IPC.taxRates.create, input),
    update: (id: number, input: Omit<TaxRate, "id">): Promise<TaxRate> =>
      ipcRenderer.invoke(IPC.taxRates.update, id, input),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.taxRates.delete, id),
  },
  numbering: {
    list: (): Promise<NumberingSequence[]> => ipcRenderer.invoke(IPC.numbering.list),
    update: (
      key: string,
      input: Pick<NumberingSequence, "prefix" | "padding" | "resetRule" | "nextValue">
    ): Promise<NumberingSequence> => ipcRenderer.invoke(IPC.numbering.update, key, input),
  },
  users: {
    list: (): Promise<User[]> => ipcRenderer.invoke(IPC.users.list),
    create: (input: { name: string; username: string; password: string; role: UserRole }): Promise<User> =>
      ipcRenderer.invoke(IPC.users.create, input),
    setActive: (id: number, active: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC.users.setActive, id, active),
    setRole: (id: number, role: UserRole): Promise<void> =>
      ipcRenderer.invoke(IPC.users.setRole, id, role),
    login: (username: string, password: string): Promise<User | null> =>
      ipcRenderer.invoke(IPC.users.login, username, password),
  },
  backup: {
    getDbPath: (): Promise<string> => ipcRenderer.invoke(IPC.backup.getDbPath),
    backupNow: (): Promise<string | null> => ipcRenderer.invoke(IPC.backup.backupNow),
    restore: (): Promise<boolean> => ipcRenderer.invoke(IPC.backup.restore),
    revealDbFolder: (): Promise<void> => ipcRenderer.invoke(IPC.backup.revealDbFolder),
  },
  reports: {
    revenue: (dateFrom: string, dateTo: string): Promise<RevenueReport> =>
      ipcRenderer.invoke(IPC.reports.revenue, dateFrom, dateTo),
    occupancy: (dateFrom: string, dateTo: string): Promise<OccupancyReport> =>
      ipcRenderer.invoke(IPC.reports.occupancy, dateFrom, dateTo),
    exportCsv: (filename: string, csv: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.reports.exportCsv, filename, csv),
  },
};

export type HotelApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
