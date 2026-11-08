import {
  formatClassBranchLabel,
  type IClass,
} from "@/types/class";
import type { EnrolledClass, EnrolledClassCourse } from "@/types/user";
import { formatClassScheduleSummary } from "@/lib/class-validation";

function courseLine(courses: EnrolledClassCourse[]): string {
  return courses
    .map((course) => {
      if (!course.name) return "";
      return course.instrument
        ? `${course.name} · ${course.instrument}`
        : course.name;
    })
    .filter(Boolean)
    .join(", ");
}

function scheduleLine(klass: EnrolledClass): string | null {
  return formatClassScheduleSummary({
    defaultWeekdays: klass.defaultWeekdays as IClass["defaultWeekdays"],
    defaultStartTime: klass.defaultStartTime,
    defaultEndTime: klass.defaultEndTime,
  });
}

export function StudentEnrolledClasses({
  classes,
  variant = "detail",
}: {
  classes?: EnrolledClass[];
  variant?: "detail" | "compact";
}) {
  if (!classes || classes.length === 0) {
    return <span className="text-sm text-gray-500">No classes</span>;
  }

  if (variant === "compact") {
    return (
      <ul className="space-y-1.5">
        {classes.map((klass) => {
          const courses = courseLine(klass.courses);
          return (
            <li key={klass.id} className="text-sm text-gray-900">
              <span className="font-medium">{klass.name}</span>
              {courses ? (
                <span className="text-gray-500"> · {courses}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {classes.map((klass) => {
        const courses = courseLine(klass.courses);
        const schedule = scheduleLine(klass);
        const teachers = (klass.teachers ?? []).map((teacher) => teacher.name).join(", ");
        return (
          <li
            key={klass.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-gray-900">{klass.name}</p>
              {klass.status && klass.status !== "active" ? (
                <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs capitalize text-gray-700">
                  {klass.status}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {courses || "Course not recorded"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {klass.branch ? formatClassBranchLabel(klass.branch) : "No branch"}
              {klass.academicYear ? ` · ${klass.academicYear}` : ""}
              {schedule ? ` · ${schedule}` : ""}
            </p>
            {teachers ? (
              <p className="mt-1 text-xs text-gray-500">{teachers}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
