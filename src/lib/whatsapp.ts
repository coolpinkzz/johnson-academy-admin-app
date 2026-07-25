import { formatClassScheduleSummary } from "@/lib/class-validation";
import { formatDisplayDate } from "@/lib/utils";
import type { CompensationBooking } from "@/types/compensation";
import {
  getCompensationRefName,
  toCompensationDateKey,
} from "@/types/compensation";

const DEFAULT_COUNTRY_CODE = "91"; // India

/** Digits only, with country code (no +). Returns null if unusable. */
export function toWhatsAppPhone(
  phone: string | undefined | null,
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;

  // Already has country code (e.g. 91XXXXXXXXXX)
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  // Local 10-digit Indian mobile
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }

  return null;
}

export function buildCompensationWhatsAppMessage(
  booking: CompensationBooking,
): string {
  const student =
    typeof booking.studentId === "object" ? booking.studentId : null;
  const homeClass =
    typeof booking.homeClassId === "object" ? booking.homeClassId : null;
  const targetClass =
    typeof booking.targetClassId === "object" ? booking.targetClassId : null;

  const studentName =
    student?.name || getCompensationRefName(booking.studentId, "Student");
  const homeName =
    homeClass?.name || getCompensationRefName(booking.homeClassId, "Home class");
  const targetName =
    targetClass?.name ||
    getCompensationRefName(booking.targetClassId, "Target class");

  const dateKey = toCompensationDateKey(booking.date);
  const dateLabel = dateKey ? formatDisplayDate(dateKey) : booking.date;

  const targetBits: string[] = [targetName];
  if (targetClass?.branch) targetBits.push(`Branch ${targetClass.branch}`);
  const schedule = targetClass
    ? formatClassScheduleSummary(targetClass)
    : null;
  if (schedule) targetBits.push(schedule);

  const lines = [
    `Hi ${studentName}, your compensation class is confirmed.`,
    "",
    `Date: ${dateLabel}`,
    `From: ${homeName}`,
    `To: ${targetBits.join(" · ")}`,
  ];

  if (booking.notes?.trim()) {
    lines.push(`Note: ${booking.notes.trim()}`);
  }

  lines.push("", "Please arrive on time. – Johnson Academy");

  return lines.join("\n");
}

export function buildWhatsAppShareUrl(
  phone: string,
  message: string,
): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Opens WhatsApp chat. Returns false if phone is missing/invalid. */
export function openCompensationWhatsApp(
  booking: CompensationBooking,
): boolean {
  const student =
    typeof booking.studentId === "object" ? booking.studentId : null;
  const phone = toWhatsAppPhone(student?.phoneNumber);
  if (!phone) return false;

  const url = buildWhatsAppShareUrl(
    phone,
    buildCompensationWhatsAppMessage(booking),
  );
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function getCompensationWhatsAppPhone(
  booking: CompensationBooking,
): string | null {
  const student =
    typeof booking.studentId === "object" ? booking.studentId : null;
  return toWhatsAppPhone(student?.phoneNumber);
}
