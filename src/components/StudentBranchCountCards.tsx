"use client";

import { StatCountCard, type StatCountTone } from "@/components/StatCountCard";
import {
  STUDENT_BRANCHES,
  useStudentBranchCounts,
  type StudentBranch,
} from "@/services/student";
import { useAuth } from "@/services/auth";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const BRANCH_TONES: Record<StudentBranch, StatCountTone> = {
  "1": "emerald",
  "2": "amber",
  "3": "violet",
  "4": "rose",
};

interface StudentBranchCountCardsProps {
  selectedBranch: StudentBranch | null;
  onBranchChange: (branch: StudentBranch | null) => void;
  className?: string;
}

function resolveVisibleBranches(
  role: string | undefined,
  branchAccess: number[] | undefined,
): StudentBranch[] {
  if (role === "master" || !role) {
    return STUDENT_BRANCHES;
  }
  if (role === "admin" || role === "aqsd") {
    const allowed = new Set((branchAccess ?? []).map(String));
    return STUDENT_BRANCHES.filter((branch) => allowed.has(branch));
  }
  return STUDENT_BRANCHES;
}

export function StudentBranchCountCards({
  selectedBranch,
  onBranchChange,
  className,
}: StudentBranchCountCardsProps) {
  const { user } = useAuth();
  const visibleBranches = useMemo(
    () => resolveVisibleBranches(user?.role, user?.branchAccess),
    [user?.role, user?.branchAccess],
  );

  const { total, byBranch, isLoadingTotal } = useStudentBranchCounts({
    branches: visibleBranches,
  });

  const handleSelect = (branch: StudentBranch | null) => {
    if (branch === null) {
      onBranchChange(null);
      return;
    }
    onBranchChange(selectedBranch === branch ? null : branch);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4",
        className,
      )}
    >
      <StatCountCard
        label="Total students"
        count={total}
        isLoading={isLoadingTotal}
        active={selectedBranch === null}
        tone="blue"
        onClick={() => handleSelect(null)}
      />

      {visibleBranches.map((branch) => (
        <StatCountCard
          key={branch}
          label={`Branch ${branch}`}
          count={byBranch[branch]?.count}
          isLoading={byBranch[branch]?.isLoading ?? false}
          active={selectedBranch === branch}
          tone={BRANCH_TONES[branch]}
          onClick={() => handleSelect(branch)}
        />
      ))}
    </div>
  );
}
