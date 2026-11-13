import {
  CLASS_WEEKDAYS,
  getClassDocumentId,
  getPopulatedStudentsInClass,
  type ClassWeekday,
  type IClass,
  type ICourse,
} from "@/types/class";

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const TIMETABLE_HOUR_PX = 64;

const BLOCK_COLORS = [
  "bg-blue-50 text-blue-950 border-blue-200",
  "bg-emerald-50 text-emerald-950 border-emerald-200",
  "bg-violet-50 text-violet-950 border-violet-200",
  "bg-amber-50 text-amber-950 border-amber-200",
  "bg-rose-50 text-rose-950 border-rose-200",
  "bg-cyan-50 text-cyan-950 border-cyan-200",
  "bg-orange-50 text-orange-950 border-orange-200",
  "bg-indigo-50 text-indigo-950 border-indigo-200",
] as const;

export function timetableColorClass(colorIndex: number): string {
  return BLOCK_COLORS[colorIndex % BLOCK_COLORS.length] ?? BLOCK_COLORS[0];
}

export function parseClockMinutes(
  value: string | undefined | null,
): number | null {
  if (!value) return null;
  const match = CLOCK_PATTERN.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClockMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function floorHour(minutes: number): number {
  return Math.floor(minutes / 60) * 60;
}

function ceilHour(minutes: number): number {
  if (minutes % 60 === 0) return minutes;
  return Math.ceil(minutes / 60) * 60;
}

function courseName(course: ICourse | string | undefined | null): string | null {
  if (!course || typeof course === "string") return null;
  return course.name || null;
}

function primaryCourseName(klass: IClass): string | undefined {
  const fromClass = courseName(klass.courseId);
  if (fromClass) return fromClass;
  for (const enrollment of getPopulatedStudentsInClass(klass.studentsInClass)) {
    if (enrollment.course?.name) return enrollment.course.name;
  }
  return undefined;
}

export type TimetableBlock = {
  key: string;
  classId: string;
  name: string;
  day: ClassWeekday;
  startMin: number;
  endMin: number;
  startLabel: string;
  endLabel: string;
  branch?: string;
  course?: string;
  column: number;
  columnCount: number;
  colorIndex: number;
};

export type UnscheduledClass = {
  classId: string;
  name: string;
  detail: string;
};

export type TimetableLegendItem = {
  classId: string;
  name: string;
  colorIndex: number;
};

export type TeacherTimetableModel = {
  rangeStart: number;
  rangeEnd: number;
  blocksByDay: Record<ClassWeekday, TimetableBlock[]>;
  legend: TimetableLegendItem[];
  unscheduled: UnscheduledClass[];
};

function emptyDays<T>(): Record<ClassWeekday, T[]> {
  return {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };
}

type DraftBlock = Omit<
  TimetableBlock,
  "startLabel" | "endLabel" | "column" | "columnCount" | "colorIndex"
>;

function placeDayBlocks(blocks: DraftBlock[]): Omit<TimetableBlock, "colorIndex">[] {
  const sorted = [...blocks].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin || a.name.localeCompare(b.name),
  );
  const columnOf = new Map<string, number>();
  const active: { endMin: number; column: number }[] = [];

  for (const block of sorted) {
    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].endMin <= block.startMin) active.splice(index, 1);
    }
    const used = new Set(active.map((item) => item.column));
    let column = 0;
    while (used.has(column)) column += 1;
    active.push({ endMin: block.endMin, column });
    columnOf.set(block.key, column);
  }

  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const current = parent.get(id) ?? id;
    if (current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };
  const union = (left: string, right: string) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(leftRoot, rightRoot);
  };

  for (const block of sorted) parent.set(block.key, block.key);
  for (let left = 0; left < sorted.length; left += 1) {
    const first = sorted[left];
    for (let right = left + 1; right < sorted.length; right += 1) {
      const second = sorted[right];
      if (second.startMin >= first.endMin) break;
      if (first.startMin < second.endMin && second.startMin < first.endMin) {
        union(first.key, second.key);
      }
    }
  }

  const maxColumn = new Map<string, number>();
  for (const block of sorted) {
    const root = find(block.key);
    const column = columnOf.get(block.key) ?? 0;
    maxColumn.set(root, Math.max(maxColumn.get(root) ?? 0, column));
  }

  return sorted.map((block) => ({
    ...block,
    startLabel: formatClockMinutes(block.startMin),
    endLabel: formatClockMinutes(block.endMin),
    column: columnOf.get(block.key) ?? 0,
    columnCount: (maxColumn.get(find(block.key)) ?? 0) + 1,
  }));
}

function scheduleGap(klass: IClass): string | null {
  const days = (klass.defaultWeekdays ?? []).filter((day) =>
    CLASS_WEEKDAYS.includes(day),
  );
  const start = parseClockMinutes(klass.defaultStartTime);
  const end = parseClockMinutes(klass.defaultEndTime);
  const hasTime = start != null && end != null && end > start;

  if (days.length > 0 && hasTime) return null;
  if (days.length === 0 && !hasTime) return "Days and time are not set";
  if (days.length === 0) return "Days are not set";
  return "Time is not set";
}

export function buildTeacherTimetable(classes: IClass[]): TeacherTimetableModel {
  const draftsByDay = emptyDays<DraftBlock>();
  const unscheduled: UnscheduledClass[] = [];
  const colorByClass = new Map<string, number>();
  let nextColor = 0;

  const colorFor = (classId: string) => {
    const existing = colorByClass.get(classId);
    if (existing != null) return existing;
    const assigned = nextColor % BLOCK_COLORS.length;
    nextColor += 1;
    colorByClass.set(classId, assigned);
    return assigned;
  };

  for (const klass of classes) {
    const classId = getClassDocumentId(klass) ?? klass.name;
    const gap = scheduleGap(klass);
    if (gap) {
      unscheduled.push({ classId, name: klass.name, detail: gap });
      continue;
    }

    const startMin = parseClockMinutes(klass.defaultStartTime);
    const endMin = parseClockMinutes(klass.defaultEndTime);
    if (startMin == null || endMin == null) continue;

    const course = primaryCourseName(klass);
    const days = (klass.defaultWeekdays ?? []).filter((day) =>
      CLASS_WEEKDAYS.includes(day),
    );

    for (const day of days) {
      draftsByDay[day].push({
        key: `${classId}-${day}`,
        classId,
        name: klass.name,
        day,
        startMin,
        endMin,
        ...(klass.branch ? { branch: klass.branch } : {}),
        ...(course ? { course } : {}),
      });
    }
  }

  let rangeStart = Number.POSITIVE_INFINITY;
  let rangeEnd = Number.NEGATIVE_INFINITY;
  for (const day of CLASS_WEEKDAYS) {
    for (const block of draftsByDay[day]) {
      rangeStart = Math.min(rangeStart, block.startMin);
      rangeEnd = Math.max(rangeEnd, block.endMin);
    }
  }

  const blocksByDay = emptyDays<TimetableBlock>();
  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
    return {
      rangeStart: 0,
      rangeEnd: 0,
      blocksByDay,
      legend: [],
      unscheduled,
    };
  }

  rangeStart = floorHour(rangeStart);
  rangeEnd = ceilHour(rangeEnd);
  if (rangeEnd <= rangeStart) rangeEnd = rangeStart + 60;

  const legend: TimetableLegendItem[] = [];
  const seenLegend = new Set<string>();

  for (const day of CLASS_WEEKDAYS) {
    const placed = placeDayBlocks(draftsByDay[day]);
    blocksByDay[day] = placed.map((block) => {
      const colorIndex = colorFor(block.classId);
      if (!seenLegend.has(block.classId)) {
        seenLegend.add(block.classId);
        legend.push({
          classId: block.classId,
          name: block.name,
          colorIndex,
        });
      }
      return { ...block, colorIndex };
    });
  }

  return {
    rangeStart,
    rangeEnd,
    blocksByDay,
    legend,
    unscheduled,
  };
}
