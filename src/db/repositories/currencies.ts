import { getDb } from "../index";
import type { Currency } from "../../shared/types";

interface CurrencyRow {
  code: string;
  symbol: string;
  is_base: number;
  exchange_rate: number;
}

function toCurrency(row: CurrencyRow): Currency {
  return { code: row.code, symbol: row.symbol, isBase: !!row.is_base, exchangeRate: row.exchange_rate };
}

export function listCurrencies(): Currency[] {
  const rows = getDb().prepare("SELECT * FROM currencies ORDER BY is_base DESC, code").all() as CurrencyRow[];
  return rows.map(toCurrency);
}

export function createCurrency(input: Currency): Currency {
  getDb()
    .prepare("INSERT INTO currencies (code, symbol, is_base, exchange_rate) VALUES (?, ?, 0, ?)")
    .run(input.code, input.symbol, input.exchangeRate);
  return { ...input, isBase: false };
}

export function setBaseCurrency(code: string): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE currencies SET is_base = 0").run();
    db.prepare("UPDATE currencies SET is_base = 1, exchange_rate = 1 WHERE code = ?").run(code);
  });
  tx();
}

export function updateCurrencyRate(code: string, exchangeRate: number): void {
  getDb().prepare("UPDATE currencies SET exchange_rate = ? WHERE code = ?").run(exchangeRate, code);
}

export function deleteCurrency(code: string): void {
  getDb().prepare("DELETE FROM currencies WHERE code = ? AND is_base = 0").run(code);
}
