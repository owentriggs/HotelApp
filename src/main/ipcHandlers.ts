import { dialog, ipcMain, shell } from "electron";
import fs from "fs";
import { IPC } from "../shared/ipc";
import * as roomTypes from "../db/repositories/roomTypes";
import * as rooms from "../db/repositories/rooms";
import * as guests from "../db/repositories/guests";
import * as bookings from "../db/repositories/bookings";
import * as settings from "../db/repositories/settings";
import * as currencies from "../db/repositories/currencies";
import * as taxRates from "../db/repositories/taxRates";
import * as numbering from "../db/repositories/numberingSettings";
import * as users from "../db/repositories/users";
import * as menu from "../db/repositories/menu";
import * as pos from "../db/repositories/pos";
import * as reports from "../db/repositories/reports";
import { checkpointAndCloseDb, getDbPath, initDb } from "../db";

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.roomTypes.list, () => roomTypes.listRoomTypes());
  ipcMain.handle(IPC.roomTypes.create, (_e, input) => roomTypes.createRoomType(input));
  ipcMain.handle(IPC.roomTypes.update, (_e, id, input) => roomTypes.updateRoomType(id, input));
  ipcMain.handle(IPC.roomTypes.delete, (_e, id) => roomTypes.deleteRoomType(id));

  ipcMain.handle(IPC.rooms.list, () => rooms.listRooms());
  ipcMain.handle(IPC.rooms.create, (_e, input) => rooms.createRoom(input));
  ipcMain.handle(IPC.rooms.update, (_e, id, input) => rooms.updateRoom(id, input));
  ipcMain.handle(IPC.rooms.updateStatus, (_e, id, status) => rooms.updateRoomStatus(id, status));
  ipcMain.handle(IPC.rooms.delete, (_e, id) => rooms.deleteRoom(id));

  ipcMain.handle(IPC.guests.list, (_e, search) => guests.listGuests(search));
  ipcMain.handle(IPC.guests.create, (_e, input) => guests.createGuest(input));
  ipcMain.handle(IPC.guests.update, (_e, id, input) => guests.updateGuest(id, input));
  ipcMain.handle(IPC.guests.delete, (_e, id) => guests.deleteGuest(id));

  ipcMain.handle(IPC.bookings.list, () => bookings.listBookings());
  ipcMain.handle(IPC.bookings.create, (_e, input) => bookings.createBooking(input));
  ipcMain.handle(IPC.bookings.isRoomAvailable, (_e, roomId, checkIn, checkOut, excludeId) =>
    bookings.isRoomAvailable(roomId, checkIn, checkOut, excludeId)
  );
  ipcMain.handle(IPC.bookings.cancel, (_e, id) => bookings.cancelBooking(id));
  ipcMain.handle(IPC.bookings.checkIn, (_e, id) => bookings.checkIn(id));
  ipcMain.handle(IPC.bookings.checkOut, (_e, id) => bookings.checkOut(id));
  ipcMain.handle(IPC.bookings.listFolioCharges, (_e, bookingId) =>
    bookings.listFolioCharges(bookingId)
  );
  ipcMain.handle(IPC.bookings.addFolioCharge, (_e, bookingId, type, description, amountCents) =>
    bookings.addFolioCharge(bookingId, type, description, amountCents, null)
  );
  ipcMain.handle(IPC.bookings.folioTotal, (_e, bookingId) => bookings.folioTotalCents(bookingId));
  ipcMain.handle(IPC.bookings.listCheckedIn, () => bookings.listCheckedInBookings());

  ipcMain.handle(IPC.menuCategories.list, () => menu.listMenuCategories());
  ipcMain.handle(IPC.menuCategories.create, (_e, name, sortOrder) => menu.createMenuCategory(name, sortOrder));
  ipcMain.handle(IPC.menuCategories.delete, (_e, id) => menu.deleteMenuCategory(id));

  ipcMain.handle(IPC.menuItems.list, () => menu.listMenuItems());
  ipcMain.handle(IPC.menuItems.create, (_e, input) => menu.createMenuItem(input));
  ipcMain.handle(IPC.menuItems.update, (_e, id, input) => menu.updateMenuItem(id, input));
  ipcMain.handle(IPC.menuItems.delete, (_e, id) => menu.deleteMenuItem(id));

  ipcMain.handle(IPC.pos.listOpenOrders, () => pos.listOpenOrders());
  ipcMain.handle(IPC.pos.createOrder, (_e, tableId) => pos.createOrder(tableId));
  ipcMain.handle(IPC.pos.listOrderItems, (_e, orderId) => pos.listOrderItems(orderId));
  ipcMain.handle(IPC.pos.addOrderItem, (_e, orderId, menuItemId, qty) => pos.addOrderItem(orderId, menuItemId, qty));
  ipcMain.handle(IPC.pos.removeOrderItem, (_e, itemId) => pos.removeOrderItem(itemId));
  ipcMain.handle(IPC.pos.orderTotal, (_e, orderId) => pos.orderTotalCents(orderId));
  ipcMain.handle(IPC.pos.voidOrder, (_e, orderId) => pos.voidOrder(orderId));
  ipcMain.handle(IPC.pos.checkoutWithPayment, (_e, orderId, method) => pos.checkoutWithPayment(orderId, method));
  ipcMain.handle(IPC.pos.checkoutToRoom, (_e, orderId, bookingId) => pos.checkoutToRoom(orderId, bookingId));

  ipcMain.handle(IPC.settings.getGeneral, () => settings.getGeneralSettings());
  ipcMain.handle(IPC.settings.updateGeneral, (_e, input) => settings.updateGeneralSettings(input));
  ipcMain.handle(IPC.settings.getPaymentMethods, () => settings.getPaymentMethods());
  ipcMain.handle(IPC.settings.updatePaymentMethods, (_e, methods) => settings.updatePaymentMethods(methods));

  ipcMain.handle(IPC.currencies.list, () => currencies.listCurrencies());
  ipcMain.handle(IPC.currencies.create, (_e, input) => currencies.createCurrency(input));
  ipcMain.handle(IPC.currencies.setBase, (_e, code) => currencies.setBaseCurrency(code));
  ipcMain.handle(IPC.currencies.updateRate, (_e, code, rate) => currencies.updateCurrencyRate(code, rate));
  ipcMain.handle(IPC.currencies.delete, (_e, code) => currencies.deleteCurrency(code));

  ipcMain.handle(IPC.taxRates.list, () => taxRates.listTaxRates());
  ipcMain.handle(IPC.taxRates.create, (_e, input) => taxRates.createTaxRate(input));
  ipcMain.handle(IPC.taxRates.update, (_e, id, input) => taxRates.updateTaxRate(id, input));
  ipcMain.handle(IPC.taxRates.delete, (_e, id) => taxRates.deleteTaxRate(id));

  ipcMain.handle(IPC.numbering.list, () => numbering.listNumberingSequences());
  ipcMain.handle(IPC.numbering.update, (_e, key, input) => numbering.updateNumberingSequence(key, input));

  ipcMain.handle(IPC.users.list, () => users.listUsers());
  ipcMain.handle(IPC.users.create, (_e, input) => users.createUser(input));
  ipcMain.handle(IPC.users.setActive, (_e, id, active) => users.setUserActive(id, active));
  ipcMain.handle(IPC.users.setRole, (_e, id, role) => users.setUserRole(id, role));
  ipcMain.handle(IPC.users.login, (_e, username, password) => users.verifyLogin(username, password));

  ipcMain.handle(IPC.backup.getDbPath, () => getDbPath());
  ipcMain.handle(IPC.backup.backupNow, async () => {
    const result = await dialog.showSaveDialog({
      title: "Save backup",
      defaultPath: `hotel-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: "SQLite database", extensions: ["db"] }],
    });
    if (result.canceled || !result.filePath) return null;
    fs.copyFileSync(getDbPath(), result.filePath);
    return result.filePath;
  });
  ipcMain.handle(IPC.backup.restore, async () => {
    const result = await dialog.showOpenDialog({
      title: "Restore from backup",
      properties: ["openFile"],
      filters: [{ name: "SQLite database", extensions: ["db"] }],
    });
    if (result.canceled || result.filePaths.length === 0) return false;
    checkpointAndCloseDb();
    fs.copyFileSync(result.filePaths[0], getDbPath());
    initDb();
    return true;
  });

  ipcMain.handle(IPC.backup.revealDbFolder, () => shell.showItemInFolder(getDbPath()));

  ipcMain.handle(IPC.reports.revenue, (_e, dateFrom, dateTo) => reports.revenueReport(dateFrom, dateTo));
  ipcMain.handle(IPC.reports.occupancy, (_e, dateFrom, dateTo) => reports.occupancyReport(dateFrom, dateTo));
  ipcMain.handle(IPC.reports.exportCsv, async (_e, filename: string, csv: string) => {
    const result = await dialog.showSaveDialog({
      title: "Export CSV",
      defaultPath: filename,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, csv, "utf-8");
    return result.filePath;
  });
}
