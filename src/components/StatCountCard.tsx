"use client";

import { Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCountTone =
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "rose";

const TONES: Record<
  StatCountTone,
  {
    card: string;
    cardActive: string;
    icon: string;
    iconActive: string;
    label: string;
    value: string;
  }
> = {
  blue: {
    card: "bg-blue-50 border-blue-100 hover:bg-blue-100/70",
    cardActive: "bg-blue-100 border-blue-400 ring-2 ring-blue-200",
    icon: "bg-blue-200/80 text-blue-700",
    iconActive: "bg-blue-600 text-white",
    label: "text-blue-700/80",
    value: "text-blue-950",
  },
  emerald: {
    card: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70",
    cardActive: "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200",
    icon: "bg-emerald-200/80 text-emerald-700",
    iconActive: "bg-emerald-600 text-white",
    label: "text-emerald-700/80",
    value: "text-emerald-950",
  },
  amber: {
    card: "bg-amber-50 border-amber-100 hover:bg-amber-100/70",
    cardActive: "bg-amber-100 border-amber-400 ring-2 ring-amber-200",
    icon: "bg-amber-200/80 text-amber-700",
    iconActive: "bg-amber-600 text-white",
    label: "text-amber-800/80",
    value: "text-amber-950",
  },
  violet: {
    card: "bg-violet-50 border-violet-100 hover:bg-violet-100/70",
    cardActive: "bg-violet-100 border-violet-400 ring-2 ring-violet-200",
    icon: "bg-violet-200/80 text-violet-700",
    iconActive: "bg-violet-600 text-white",
    label: "text-violet-700/80",
    value: "text-violet-950",
  },
  rose: {
    card: "bg-rose-50 border-rose-100 hover:bg-rose-100/70",
    cardActive: "bg-rose-100 border-rose-400 ring-2 ring-rose-200",
    icon: "bg-rose-200/80 text-rose-700",
    iconActive: "bg-rose-600 text-white",
    label: "text-rose-700/80",
    value: "text-rose-950",
  },
};

export interface StatCountCardProps {
  label: string;
  count?: number;
  isLoading?: boolean;
  active?: boolean;
  tone?: StatCountTone;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

function formatCount(count: number | undefined, isLoading: boolean) {
  if (typeof count === "number") return count;
  return isLoading ? "…" : "—";
}

export function StatCountCard({
  label,
  count,
  isLoading = false,
  active = false,
  tone = "blue",
  icon: Icon = Users,
  onClick,
  className,
}: StatCountCardProps) {
  const tones = TONES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-4 flex items-center gap-3 text-left shadow-sm transition-all",
        active ? tones.cardActive : tones.card,
        className,
      )}
    >
      <div
        className={cn(
          "p-2.5 rounded-lg shrink-0",
          active ? tones.iconActive : tones.icon,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xs sm:text-sm font-medium truncate", tones.label)}>
          {label}
        </p>
        <p
          className={cn(
            "text-xl sm:text-2xl font-bold tabular-nums",
            tones.value,
          )}
        >
          {formatCount(count, isLoading)}
        </p>
      </div>
    </button>
  );
}
