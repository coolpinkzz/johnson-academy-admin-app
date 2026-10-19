export function currentReportingMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return "";
  return `${year}-${month}`;
}

export function formatScore(value: number | null | undefined, outOf: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${shown} / ${outOf}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatSigned(value: number | null, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  const formatted = digits > 0 ? value.toFixed(digits) : String(value);
  if (value > 0) return `+${formatted}`;
  return formatted;
}

export function formatSubmittedAt(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function monthLabel(month: string, fallbackLabel?: string): string {
  if (fallbackLabel) return fallbackLabel;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match?.[1] || !match[2]) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(date);
}
