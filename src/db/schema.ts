export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','front_desk','pos_staff')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  base_rate_cents INTEGER NOT NULL DEFAULT 0,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  floor TEXT,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant','occupied','dirty','clean','maintenance','out_of_order')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_number TEXT,
  address TEXT,
  notes TEXT,
  vip INTEGER NOT NULL DEFAULT 0,
  blacklisted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_number TEXT NOT NULL UNIQUE,
  guest_id INTEGER NOT NULL REFERENCES guests(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  actual_check_in_at TEXT,
  actual_check_out_at TEXT,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','checked_in','checked_out','cancelled','no_show')),
  rate_cents INTEGER NOT NULL DEFAULT 0,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS folio_charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  type TEXT NOT NULL CHECK (type IN ('room','food','service','adjustment')),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id),
  pos_order_id INTEGER,
  method TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  is_base INTEGER NOT NULL DEFAULT 0,
  exchange_rate REAL NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  percentage REAL NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('rooms','pos','both'))
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate_id INTEGER REFERENCES tax_rates(id),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS pos_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  table_id INTEGER REFERENCES restaurant_tables(id),
  booking_id INTEGER REFERENCES bookings(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','void')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES pos_orders(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS numbering_sequences (
  key TEXT PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT '',
  next_value INTEGER NOT NULL DEFAULT 1,
  padding INTEGER NOT NULL DEFAULT 4,
  reset_rule TEXT NOT NULL DEFAULT 'never' CHECK (reset_rule IN ('never','yearly','monthly')),
  last_reset_period TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
