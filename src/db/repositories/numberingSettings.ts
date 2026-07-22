import { getDb } from "../index";
import type { NumberingSequence } from "../../shared/types";

interface NumberingRow {
  key: string;
  prefix: string;
  next_value: number;
  padding: number;
  reset_rule: NumberingSequence["resetRule"];
  last_reset_period: string | null;
}

function toSequence(row: NumberingRow): NumberingSequence {
  return {
    key: row.key,
    prefix: row.prefix,
    nextValue: row.next_value,
    padding: row.padding,
    resetRule: row.reset_rule,
    lastResetPeriod: row.last_reset_period,
  };
}

export function listNumberingSequences(): NumberingSequence[] {
  const rows = getDb().prepare("SELECT * FROM numbering_sequences ORDER BY key").all() as NumberingRow[];
  return rows.map(toSequence);
}

export function updateNumberingSequence(
  key: string,
  input: Pick<NumberingSequence, "prefix" | "padding" | "resetRule" | "nextValue">
): NumberingSequence {
  getDb()
    .prepare(
      "UPDATE numbering_sequences SET prefix = ?, padding = ?, reset_rule = ?, next_value = ? WHERE key = ?"
    )
    .run(input.prefix, input.padding, input.resetRule, input.nextValue, key);
  const row = getDb().prepare("SELECT * FROM numbering_sequences WHERE key = ?").get(key) as NumberingRow;
  return toSequence(row);
}
