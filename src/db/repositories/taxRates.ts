import { getDb } from "../index";
import type { TaxRate } from "../../shared/types";

interface TaxRateRow {
  id: number;
  name: string;
  percentage: number;
  applies_to: TaxRate["appliesTo"];
}

function toTaxRate(row: TaxRateRow): TaxRate {
  return { id: row.id, name: row.name, percentage: row.percentage, appliesTo: row.applies_to };
}

export function listTaxRates(): TaxRate[] {
  const rows = getDb().prepare("SELECT * FROM tax_rates ORDER BY name").all() as TaxRateRow[];
  return rows.map(toTaxRate);
}

export function createTaxRate(input: Omit<TaxRate, "id">): TaxRate {
  const result = getDb()
    .prepare("INSERT INTO tax_rates (name, percentage, applies_to) VALUES (?, ?, ?)")
    .run(input.name, input.percentage, input.appliesTo);
  return { id: Number(result.lastInsertRowid), ...input };
}

export function updateTaxRate(id: number, input: Omit<TaxRate, "id">): TaxRate {
  getDb()
    .prepare("UPDATE tax_rates SET name = ?, percentage = ?, applies_to = ? WHERE id = ?")
    .run(input.name, input.percentage, input.appliesTo, id);
  return { id, ...input };
}

export function deleteTaxRate(id: number): void {
  getDb().prepare("DELETE FROM tax_rates WHERE id = ?").run(id);
}
