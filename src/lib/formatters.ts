import { I18N, Locale } from './translations';

export function formatTHB(amount: number, opts: { sign?: boolean, compact?: boolean } = {}) {
  const { sign = false, compact = false } = opts;
  const v = Math.abs(amount);
  const formatted = compact && v >= 1000
    ? v >= 1_000_000 ? (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      : (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K"
    : v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
  if (sign && amount < 0) return "−฿" + formatted;
  if (sign && amount > 0) return "+฿" + formatted;
  return "฿" + formatted;
}

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Today's date in Bangkok timezone as YYYY-MM-DD */
export function todayBangkok(): string {
  return new Date(Date.now() + BKK_OFFSET_MS).toISOString().split('T')[0];
}

/** Convert a YYYY-MM-DD picker value to an ISO string at noon Bangkok time */
export function datePickerToIso(dateStr: string): string {
  return `${dateStr}T12:00:00+07:00`;
}

/** Extract the date portion (YYYY-MM-DD) in Bangkok timezone from an ISO string */
export function isoToBangkokDate(iso: string): string {
  return new Date(new Date(iso).getTime() + BKK_OFFSET_MS).toISOString().split('T')[0];
}

export function formatDate(iso: string, locale: Locale = "th", style: "short" | "medium" | "time" | "default" = "short") {
  const d = new Date(iso);
  const months = I18N[locale]?.months || I18N.en.months;
  if (style === "short") return `${d.getDate()} ${months[d.getMonth()]}`;
  if (style === "medium") return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  if (style === "time") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
}
