import path from "path";
import Database from "better-sqlite3";
import { app } from "electron";
import bcrypt from "bcryptjs";
import { SCHEMA_SQL } from "./schema";

let db: Database.Database | null = null;

export function getDbPath(): string {
  return path.join(app.getPath("userData"), "hotel.db");
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export function initDb(): Database.Database {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
  seedDefaults(db);
  return db;
}

export function checkpointAndCloseDb(): void {
  if (db) {
    db.pragma("wal_checkpoint(FULL)");
    db.close();
    db = null;
  }
}

function seedDefaults(database: Database.Database) {
  const userCount = database.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c === 0) {
    const passwordHash = bcrypt.hashSync("admin", 10);
    database
      .prepare(
        "INSERT INTO users (name, username, password_hash, role, active) VALUES (?, ?, ?, 'admin', 1)"
      )
      .run("Administrator", "admin", passwordHash);
  }

  const seqCount = database.prepare("SELECT COUNT(*) as c FROM numbering_sequences").get() as {
    c: number;
  };
  if (seqCount.c === 0) {
    const insertSeq = database.prepare(
      "INSERT INTO numbering_sequences (key, prefix, next_value, padding, reset_rule) VALUES (?, ?, 1, 4, 'yearly')"
    );
    insertSeq.run("booking", "BK-");
    insertSeq.run("invoice", "INV-");
    insertSeq.run("pos_receipt", "R-");
  }

  const currencyCount = database.prepare("SELECT COUNT(*) as c FROM currencies").get() as {
    c: number;
  };
  if (currencyCount.c === 0) {
    database
      .prepare(
        "INSERT INTO currencies (code, symbol, is_base, exchange_rate) VALUES (?, ?, 1, 1)"
      )
      .run("USD", "$");
  }

  const taxCount = database.prepare("SELECT COUNT(*) as c FROM tax_rates").get() as { c: number };
  if (taxCount.c === 0) {
    database
      .prepare("INSERT INTO tax_rates (name, percentage, applies_to) VALUES (?, ?, 'both')")
      .run("Standard", 0);
  }

  const settingsCount = database.prepare("SELECT COUNT(*) as c FROM settings").get() as {
    c: number;
  };
  if (settingsCount.c === 0) {
    database
      .prepare("INSERT INTO settings (key, value) VALUES ('general', ?)")
      .run(
        JSON.stringify({
          hotelName: "My Hotel",
          address: "",
          phone: "",
          email: "",
          defaultCheckInTime: "14:00",
          defaultCheckOutTime: "11:00",
          dateFormat: "yyyy-MM-dd",
          theme: "system",
        })
      );
  }
}
