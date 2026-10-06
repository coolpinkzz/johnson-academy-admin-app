import { parseInputDate } from "@/lib/utils";
import { toCompensationDateKey } from "@/types/compensation";
import type { FeePackage } from "@/types/studentFee";

const DAY_MS = 24 * 60 * 60 * 1000;

const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** e.g. 28600 → "₹28,600" */
export function formatRupees(amount: number): string {
  return rupeeFormatter.format(amount);
}

/** API date (ISO or YYYY-MM-DD) → YYYY-MM-DD */
export const toDateKey = toCompensationDateKey;

/** e.g. "1 May 2026" */
export function formatShortDate(date: string): string {
  const key = toDateKey(date);
  if (!key) return "—";
  return parseInputDate(key).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function keyToUtc(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function utcToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysToKey(key: string, days: number): string {
  return utcToKey(new Date(keyToUtc(key).getTime() + days * DAY_MS));
}

/**
 * Mirrors the BE: last covered day = start + N months - 1 day (clamped to month length).
 * "2026-05-01" + 12 → "2027-04-30"
 */
export function calculatePackageEndDate(
  startKey: string,
  durationMonths: number,
): string {
  const start = keyToUtc(startKey);
  const totalMonths = start.getUTCMonth() + durationMonths;
  const year = start.getUTCFullYear() + Math.floor(totalMonths / 12);
  const monthIndex = totalMonths % 12;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(start.getUTCDate(), daysInMonth);
  return utcToKey(new Date(Date.UTC(year, monthIndex, day) - DAY_MS));
}

/** "Ends in 12 days" / "Ends today" / "Expired 5 days ago" / "Starts in 3 days" */
export function describePackageTiming(pkg: {
  daysRemaining: number;
  renewalStatus: string | null;
  startDate: string;
}): string {
  if (pkg.renewalStatus === "upcoming") {
    return `Starts ${formatShortDate(pkg.startDate)}`;
  }
  const days = pkg.daysRemaining;
  if (days === 0) return "Ends today";
  if (days > 0) return `Ends in ${days} day${days === 1 ? "" : "s"}`;
  const ago = Math.abs(days);
  return `Expired ${ago} day${ago === 1 ? "" : "s"} ago`;
}

export function formatDuration(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

export type CourseFeeGroup = {
  courseId: string;
  courseName: string;
  instrument: string | null;
  /** Latest valid package for this course, if any */
  current: FeePackage | null;
  history: FeePackage[];
};

/** Group a student's packages by course; the current one is the latest valid package. */
export function groupPackagesByCourse(packages: FeePackage[]): CourseFeeGroup[] {
  const byCourse = new Map<string, FeePackage[]>();

  packages.forEach((pkg) => {
    const courseId = pkg.course?.id ?? "unknown";
    const list = byCourse.get(courseId) ?? [];
    list.push(pkg);
    byCourse.set(courseId, list);
  });

  return Array.from(byCourse.entries())
    .map(([courseId, coursePackages]) => {
      const sorted = [...coursePackages].sort((a, b) => {
        if (a.state !== b.state) return a.state === "valid" ? -1 : 1;
        return toDateKey(b.endDate).localeCompare(toDateKey(a.endDate));
      });
      const current = sorted.find((pkg) => pkg.state === "valid") ?? null;
      const sample = current ?? sorted[0];
      return {
        courseId,
        courseName: sample?.course?.name ?? "Unknown course",
        instrument: sample?.course?.instrument ?? null,
        current,
        history: sorted.filter((pkg) => pkg.id !== current?.id),
      };
    })
    .sort((a, b) => a.courseName.localeCompare(b.courseName));
}
