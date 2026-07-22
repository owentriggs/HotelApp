import { getDb } from "../index";

function currentPeriod(resetRule: string): string | null {
  const now = new Date();
  if (resetRule === "yearly") return String(now.getFullYear());
  if (resetRule === "monthly") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return null;
}

// Atomically consumes the next number for a sequence, formatting it as "<prefix><padded number>".
// Resets the counter to 1 when the sequence's reset period (yearly/monthly) has rolled over.
export function nextNumber(key: string): string {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM numbering_sequences WHERE key = ?")
    .get(key) as
    | {
        key: string;
        prefix: string;
        next_value: number;
        padding: number;
        reset_rule: string;
        last_reset_period: string | null;
      }
    | undefined;

  if (!row) {
    throw new Error(`Unknown numbering sequence: ${key}`);
  }

  const period = currentPeriod(row.reset_rule);
  let value = row.next_value;
  if (period !== null && period !== row.last_reset_period) {
    value = 1;
  }

  db.prepare(
    "UPDATE numbering_sequences SET next_value = ?, last_reset_period = ? WHERE key = ?"
  ).run(value + 1, period, key);

  return `${row.prefix}${String(value).padStart(row.padding, "0")}`;
}
