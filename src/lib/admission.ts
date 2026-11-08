export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const REFERRAL_SOURCES = [
  { value: "friend_or_family", label: "Friend or family" },
  { value: "social_media", label: "Social media" },
  { value: "google", label: "Google" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "advertisement", label: "Advertisement" },
  { value: "existing_student", label: "Existing student" },
  { value: "other", label: "Other" },
] as const;

export type Gender = (typeof GENDERS)[number]["value"];
export type ReferralSource = (typeof REFERRAL_SOURCES)[number]["value"];

export const PHONE_PATTERN = /^\+?[\d\s-()]+$/;

export function genderLabel(value?: string | null): string {
  return GENDERS.find((option) => option.value === value)?.label ?? "";
}

export function referralLabel(value?: string | null): string {
  return REFERRAL_SOURCES.find((option) => option.value === value)?.label ?? "";
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? "";
}

export function formatAdmissionDate(value?: string | null): string {
  const iso = toDateInputValue(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayDateInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function referralDisplay(
  source?: string | null,
  other?: string | null,
): string {
  if (source === "other") return other?.trim() || "";
  return referralLabel(source);
}

export const PARENT_DETAILS_MAX_AGE = 15;

export function ageFromDateOfBirth(
  value?: string | null,
  today = new Date(),
): number | null {
  const iso = toDateInputValue(value);
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

export function requiresParentDetails(value?: string | null, today = new Date()): boolean {
  const age = ageFromDateOfBirth(value, today);
  return age != null && age <= PARENT_DETAILS_MAX_AGE;
}

export function formatStudentAge(value?: string | null): string {
  const age = ageFromDateOfBirth(value);
  if (age == null || age < 0) return "";
  return `${age} ${age === 1 ? "year" : "years"}`;
}

export function profileCardStatus(student: {
  isProfileCardComplete?: boolean | null;
  profilePicture?: string | null;
  dateOfBirth?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
}): "Completed" | "Pending" {
  if (!student.isProfileCardComplete) return "Pending";
  if (!student.profilePicture?.trim()) return "Pending";
  if (
    requiresParentDetails(student.dateOfBirth) &&
    (!student.motherName?.trim() || !student.fatherName?.trim())
  ) {
    return "Pending";
  }
  return "Completed";
}
