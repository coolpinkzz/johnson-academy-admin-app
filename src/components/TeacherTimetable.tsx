"use client";

import {
  TIMETABLE_HOUR_PX,
  buildTeacherTimetable,
  formatClockMinutes,
  timetableColorClass,
  type TimetableBlock,
} from "@/lib/teacher-timetable";
import {
  CLASS_WEEKDAYS,
  getClassDocumentId,
  type ClassWeekday,
  type IClass,
} from "@/types/class";
import { Clock } from "lucide-react";
import React, { useMemo } from "react";

const DAY_SHORT: Record<ClassWeekday, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const GRID_COLUMNS =
  "grid grid-cols-[3.25rem_repeat(7,minmax(5.75rem,1fr))] min-w-[44rem]";

function todayWeekday(): ClassWeekday {
  const index = (new Date().getDay() + 6) % 7;
  return CLASS_WEEKDAYS[index] ?? "Monday";
}

function blockStyle(block: TimetableBlock, rangeStart: number) {
  const top = ((block.startMin - rangeStart) / 60) * TIMETABLE_HOUR_PX;
  const height = Math.max(
    ((block.endMin - block.startMin) / 60) * TIMETABLE_HOUR_PX - 4,
    22,
  );
  return {
    top,
    height,
    left: `calc(${(block.column / block.columnCount) * 100}% + 3px)`,
    width: `calc(${100 / block.columnCount}% - 6px)`,
  };
}

type TeacherTimetableProps = {
  classes: IClass[];
  onOpenClass: (klass: IClass) => void;
};

export function TeacherTimetable({
  classes,
  onOpenClass,
}: TeacherTimetableProps) {
  const model = useMemo(() => buildTeacherTimetable(classes), [classes]);
  const today = todayWeekday();
  const classById = useMemo(() => {
    const map = new Map<string, IClass>();
    for (const klass of classes) {
      map.set(getClassDocumentId(klass) ?? klass.name, klass);
    }
    return map;
  }, [classes]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    if (model.rangeEnd <= model.rangeStart) return marks;
    for (let minute = model.rangeStart; minute <= model.rangeEnd; minute += 60) {
      marks.push(minute);
    }
    return marks;
  }, [model.rangeEnd, model.rangeStart]);

  const trackHeight =
    ((model.rangeEnd - model.rangeStart) / 60) * TIMETABLE_HOUR_PX;
  const trackPaddingBottom = 14;
  const hasGrid = model.legend.length > 0 && trackHeight > 0;

  const openBlock = (block: TimetableBlock) => {
    const klass = classById.get(block.classId);
    if (klass) onOpenClass(klass);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 sm:p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          Weekly timetable
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Days across the top, times down the side. A class fills every day it
          meets.
        </p>
        {model.legend.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {model.legend.map((item) => (
              <li
                key={item.classId}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${timetableColorClass(item.colorIndex)}`}
              >
                {item.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hasGrid ? (
        <div className="overflow-auto max-h-[36rem]">
          <div className={`${GRID_COLUMNS} sticky top-0 z-20 border-b bg-white`}>
            <div className="border-r border-gray-100" />
            {CLASS_WEEKDAYS.map((day) => {
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`px-1 py-2 text-center text-xs font-semibold border-l border-gray-100 ${
                    isToday ? "bg-blue-50 text-blue-700" : "text-gray-600"
                  }`}
                >
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  <span className="hidden sm:inline">{day}</span>
                  {isToday ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-blue-600">
                      Today
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className={GRID_COLUMNS}>
            <div
              className="relative border-r border-gray-100"
              style={{ height: trackHeight + trackPaddingBottom }}
            >
              {hourMarks.map((minute) => (
                <span
                  key={minute}
                  className="absolute right-1.5 text-[11px] tabular-nums text-gray-400"
                  style={{
                    top:
                      ((minute - model.rangeStart) / 60) * TIMETABLE_HOUR_PX + 2,
                  }}
                >
                  {formatClockMinutes(minute)}
                </span>
              ))}
            </div>

            {CLASS_WEEKDAYS.map((day) => {
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`relative border-l border-gray-100 ${
                    isToday ? "bg-blue-50/40" : "bg-white"
                  }`}
                  style={{ height: trackHeight + trackPaddingBottom }}
                >
                  {hourMarks.slice(0, -1).map((minute) => (
                    <div
                      key={minute}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{
                        top:
                          ((minute - model.rangeStart) / 60) * TIMETABLE_HOUR_PX,
                      }}
                    />
                  ))}
                  {model.blocksByDay[day].map((block) => (
                    <button
                      key={block.key}
                      type="button"
                      onClick={() => openBlock(block)}
                      style={blockStyle(block, model.rangeStart)}
                      title={`${block.name}, ${block.startLabel}–${block.endLabel}${
                        block.branch ? `, Branch ${block.branch}` : ""
                      }`}
                      aria-label={`${block.name}, ${day}, ${block.startLabel} to ${block.endLabel}`}
                      className={`absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left shadow-sm hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${timetableColorClass(block.colorIndex)}`}
                    >
                      <span className="block truncate text-xs font-semibold leading-tight">
                        {block.name}
                      </span>
                      <span className="block truncate text-[10px] leading-tight opacity-80">
                        {block.startLabel}–{block.endLabel}
                      </span>
                      {block.course && block.endMin - block.startMin >= 50 ? (
                        <span className="block truncate text-[10px] leading-tight opacity-70">
                          {block.course}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 py-8 text-sm text-gray-500">
          No class has both weekdays and a start and end time yet.
        </div>
      )}

      {model.unscheduled.length > 0 ? (
        <div className="border-t px-4 py-4 sm:px-6">
          <p className="text-sm font-medium text-gray-900">
            Not shown on the grid
          </p>
          <ul className="mt-2 space-y-1">
            {model.unscheduled.map((item) => (
              <li key={item.classId} className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-gray-400"> · </span>
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
