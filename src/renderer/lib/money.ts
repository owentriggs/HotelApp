export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function inputToCents(value: string): number {
  return Math.round(parseFloat(value || "0") * 100);
}

export function formatCents(cents: number, symbol = "$"): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
