"use client";

import { StatCountCard, type StatCountTone } from "@/components/StatCountCard";
import {
  STUDENT_BRANCHES,
  useStudentBranchCounts,
  type StudentBranch,
} from "@/services/student";
import { cn } from "@/lib/utils";

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

export function StudentBranchCountCards({
  selectedBranch,
  onBranchChange,
  className,
}: StudentBranchCountCardsProps) {
  const { total, byBranch, isLoadingTotal } = useStudentBranchCounts();

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

      {STUDENT_BRANCHES.map((branch) => (
        <StatCountCard
          key={branch}
          label={`Branch ${branch}`}
          count={byBranch[branch].count}
          isLoading={byBranch[branch].isLoading}
          active={selectedBranch === branch}
          tone={BRANCH_TONES[branch]}
          onClick={() => handleSelect(branch)}
        />
      ))}
    </div>
  );
}
