import { z } from "zod";
import {
  CLASS_BRANCHES,
  CLASS_WEEKDAYS,
  type ClassFormData,
  type ClassWeekday,
  type IClass,
  classTeacherRefId,
  getClassTeacherList,
} from "@/types/class";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalPositiveInt = z
  .union([z.number(), z.string(), z.literal(""), z.undefined(), z.null()])
  .transform((v, ctx) => {
    if (v === "" || v === undefined || v === null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Must be an integer ≥ 1",
      });
      return z.NEVER;
    }
    return n;
  });

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export const classFormSchema = z
  .object({
    name: z.string().trim().min(1, "Class name is required"),
    teachers: z
      .array(z.string().regex(OBJECT_ID_REGEX, "Invalid teacher id"))
      .min(1, "Select at least one teacher"),
    branch: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine(
        (v) => v === undefined || (CLASS_BRANCHES as string[]).includes(v),
        { message: "Branch must be 1–12" },
      ),
    academicYear: optionalTrimmedString,
    notes: optionalTrimmedString,
    sessionCapacity: optionalPositiveInt,
    defaultWeekdays: z
      .array(z.enum(CLASS_WEEKDAYS as [ClassWeekday, ...ClassWeekday[]]))
      .default([])
      .refine(
        (days) => new Set(days).size === days.length,
        "Weekdays must be unique",
      ),
    defaultStartTime: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    defaultEndTime: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : undefined)),
  })
  .superRefine((data, ctx) => {
    const start = data.defaultStartTime;
    const end = data.defaultEndTime;
    const hasStart = Boolean(start);
    const hasEnd = Boolean(end);

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: "custom",
        path: hasStart ? ["defaultEndTime"] : ["defaultStartTime"],
        message:
          "defaultStartTime and defaultEndTime must both be provided, or both left empty",
      });
      return;
    }

    if (!hasStart || !hasEnd || !start || !end) return;

    if (!HH_MM_REGEX.test(start)) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultStartTime"],
        message: "Use HH:mm (24-hour)",
      });
    }
    if (!HH_MM_REGEX.test(end)) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultEndTime"],
        message: "Use HH:mm (24-hour)",
      });
    }
    if (HH_MM_REGEX.test(start) && HH_MM_REGEX.test(end)) {
      if (timeToMinutes(start) >= timeToMinutes(end)) {
        ctx.addIssue({
          code: "custom",
          path: ["defaultEndTime"],
          message: "End time must be after start time",
        });
      }
    }
  });

export type ClassFormValues = z.input<typeof classFormSchema>;
export type ClassFormParsed = z.output<typeof classFormSchema>;

export const CLASS_FORM_DEFAULTS: ClassFormData = {
  name: "",
  teachers: [],
  defaultWeekdays: [],
};

export function classToFormValues(initial?: Partial<IClass>): ClassFormData {
  if (!initial) {
    return { ...CLASS_FORM_DEFAULTS };
  }

  return {
    name: initial.name ?? "",
    teachers: getClassTeacherList(initial).map((t) => classTeacherRefId(t)),
    branch: initial.branch,
    academicYear: initial.academicYear,
    notes: initial.notes,
    sessionCapacity: initial.sessionCapacity,
    defaultWeekdays: initial.defaultWeekdays ?? [],
    defaultStartTime: initial.defaultStartTime,
    defaultEndTime: initial.defaultEndTime,
  };
}

/** Build API payload — only fields exposed in the form. */
export function toClassApiPayload(parsed: ClassFormParsed): ClassFormData {
  const payload: ClassFormData = {
    name: parsed.name,
    teachers: parsed.teachers,
    defaultWeekdays: parsed.defaultWeekdays,
  };

  if (parsed.branch) payload.branch = parsed.branch;
  if (parsed.academicYear) payload.academicYear = parsed.academicYear;
  if (parsed.notes) payload.notes = parsed.notes;
  if (parsed.sessionCapacity != null) {
    payload.sessionCapacity = parsed.sessionCapacity;
  }
  if (parsed.defaultStartTime) payload.defaultStartTime = parsed.defaultStartTime;
  if (parsed.defaultEndTime) payload.defaultEndTime = parsed.defaultEndTime;

  return payload;
}

export function zodErrorsToRecord(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}

const WEEKDAY_SHORT: Record<ClassWeekday, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function formatClassScheduleSummary(
  klass: Pick<
    IClass,
    "defaultWeekdays" | "defaultStartTime" | "defaultEndTime"
  >,
): string | null {
  const days = klass.defaultWeekdays ?? [];
  const start = klass.defaultStartTime;
  const end = klass.defaultEndTime;
  const dayPart =
    days.length > 0
      ? days.map((d) => WEEKDAY_SHORT[d] ?? d.slice(0, 3)).join(", ")
      : null;
  const timePart = start && end ? `${start}–${end}` : null;

  if (dayPart && timePart) return `${dayPart} · ${timePart}`;
  if (dayPart) return dayPart;
  if (timePart) return timePart;
  return null;
}
