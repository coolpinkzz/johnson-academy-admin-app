import type { ClassWeekday } from "./class";

export const COMPENSATION_BOOKING_STATUSES = ["confirmed", "cancelled"] as const;
export type CompensationBookingStatus =
  (typeof COMPENSATION_BOOKING_STATUSES)[number];

export interface CompensationUserRef {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  rollNumber?: string;
  role?: string;
  phoneNumber?: string;
}

export interface CompensationClassRef {
  id?: string;
  _id?: string;
  name: string;
  branch?: string;
  defaultWeekdays?: ClassWeekday[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  sessionCapacity?: number;
}

export interface ClassSeatAvailability {
  classId: string;
  sessionCapacity: number;
  enrolledCount: number;
  confirmedGuestCount: number;
  usedSeats: number;
  availableSeats: number;
  isAvailable: boolean;
}

export interface AvailableCompensationClass {
  class: CompensationClassRef;
  availability: ClassSeatAvailability;
  date: string;
}

export interface ClassAvailabilityResponse extends ClassSeatAvailability {
  date: string;
  runsOnDate: boolean;
}

export interface CompensationBooking {
  id: string;
  _id?: string;
  studentId: CompensationUserRef | string;
  homeClassId: CompensationClassRef | string;
  targetClassId: CompensationClassRef | string;
  date: string;
  status: CompensationBookingStatus;
  bookedBy?: CompensationUserRef | string;
  cancelledAt?: string;
  cancelledBy?: CompensationUserRef | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationBookingResponse {
  results: CompensationBooking[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface GetCompensationBookingsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  studentId?: string;
  homeClassId?: string;
  targetClassId?: string;
  date?: string;
  status?: CompensationBookingStatus;
}

export interface ListAvailableClassesParams {
  date: string;
  branch?: string;
  homeClassId?: string;
  excludeClassId?: string;
}

export interface CreateCompensationBookingPayload {
  studentId: string;
  homeClassId: string;
  targetClassId: string;
  date: string;
  notes?: string;
}

export function getCompensationRefId(
  ref: { id?: string; _id?: string } | string | undefined | null,
): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.id || ref._id || "";
}

export function getCompensationRefName(
  ref: { name?: string } | string | undefined | null,
  fallback = "—",
): string {
  if (!ref) return fallback;
  if (typeof ref === "string") return fallback;
  return ref.name || fallback;
}

/** Normalize API date (ISO or YYYY-MM-DD) to YYYY-MM-DD. */
export function toCompensationDateKey(date: string | Date): string {
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    if (date.includes("T")) return date.slice(0, 10);
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Today in Asia/Kolkata as YYYY-MM-DD (matches BE). */
export function todayInIndia(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

export function isCompensationDatePast(date: string | Date): boolean {
  const key = toCompensationDateKey(date);
  if (!key) return false;
  return key < todayInIndia();
}
