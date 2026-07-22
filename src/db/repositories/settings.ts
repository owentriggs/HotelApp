import { getDb } from "../index";
import type { GeneralSettings } from "../../shared/types";

export function getGeneralSettings(): GeneralSettings {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = 'general'").get() as
    | { value: string }
    | undefined;
  if (!row) {
    throw new Error("General settings not seeded");
  }
  return JSON.parse(row.value);
}

export function updateGeneralSettings(input: GeneralSettings): GeneralSettings {
  getDb()
    .prepare("UPDATE settings SET value = ? WHERE key = 'general'")
    .run(JSON.stringify(input));
  return input;
}

export function getPaymentMethods(): string[] {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = 'paymentMethods'").get() as
    | { value: string }
    | undefined;
  return row ? JSON.parse(row.value) : ["Cash", "Card"];
}

export function updatePaymentMethods(methods: string[]): string[] {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES ('paymentMethods', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(JSON.stringify(methods));
  return methods;
}
