const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_DECIMAL = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return rupeesToPaise(n);
}

export function formatPaise(paise: number, compact = false): string {
  if (compact && Math.abs(paise) >= 10000000) {
    return `₹${(paise / 10000000).toFixed(1)}Cr`;
  }
  if (compact && Math.abs(paise) >= 100000) {
    return `₹${(paise / 100000).toFixed(1)}L`;
  }
  if (Math.abs(paise) % 100 === 0) {
    return INR.format(paise / 100);
  }
  return INR_DECIMAL.format(paise / 100);
}

export function formatSignedPaise(paise: number, direction: "IN" | "OUT"): string {
  const sign = direction === "IN" ? "+" : "−";
  return `${sign}${formatPaise(paise)}`;
}
