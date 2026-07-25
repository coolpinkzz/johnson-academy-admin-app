"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import { useModal } from "@/hooks/use-modal";
import { formatClassScheduleSummary } from "@/lib/class-validation";
import { formatDisplayDate } from "@/lib/utils";
import {
  getCompensationWhatsAppPhone,
  openCompensationWhatsApp,
} from "@/lib/whatsapp";
import {
  useAvailableCompensationClasses,
  useCreateCompensationBooking,
} from "@/services/compensation";
import { getStudentById, searchStudents } from "@/services/student";
import type {
  AvailableCompensationClass,
  CompensationBooking,
} from "@/types/compensation";
import {
  getCompensationRefId,
  isCompensationDatePast,
  todayInIndia,
} from "@/types/compensation";
import type { User } from "@/types/user";
import { CLASS_BRANCHES } from "@/types/class";
import { toast } from "react-toastify";

type Step = 1 | 2 | 3 | 4;

type HomeClassOption = {
  id: string;
  name: string;
};

type Props = {
  onSuccess?: () => void;
};

function resolveStudentId(student: User): string {
  return student.id || student._id;
}

export function BookCompensationModal({ onSuccess }: Props) {
  const { closeModal } = useModal();
  const createMutation = useCreateCompensationBooking();

  const [step, setStep] = useState<Step>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [date, setDate] = useState(todayInIndia());
  const [homeClassId, setHomeClassId] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [selectedTarget, setSelectedTarget] =
    useState<AvailableCompensationClass | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] =
    useState<CompensationBooking | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentId = selectedStudent ? resolveStudentId(selectedStudent) : "";

  const { data: studentDetail, isLoading: isLoadingStudentDetail } = useQuery({
    queryKey: ["students", "detail", studentId],
    queryFn: () => getStudentById(studentId),
    enabled: Boolean(studentId),
  });

  const homeClassOptions: HomeClassOption[] = useMemo(() => {
    const classes = studentDetail?.classes ?? selectedStudent?.classes ?? [];
    return classes
      .map((c) => ({
        id: c.id,
        name: c.name,
      }))
      .filter((c) => Boolean(c.id && c.name));
  }, [studentDetail?.classes, selectedStudent?.classes]);

  useEffect(() => {
    if (homeClassOptions.length === 1) {
      setHomeClassId(homeClassOptions[0].id);
      return;
    }
    if (
      homeClassId &&
      !homeClassOptions.some((option) => option.id === homeClassId)
    ) {
      setHomeClassId("");
    }
  }, [homeClassOptions, homeClassId]);

  const availableParams =
    step >= 2 && date && homeClassId
      ? {
          date,
          homeClassId,
          ...(branchFilter ? { branch: branchFilter } : {}),
        }
      : null;

  const {
    data: availableClasses,
    isLoading: isLoadingAvailable,
    isFetching: isFetchingAvailable,
    error: availableError,
  } = useAvailableCompensationClasses(availableParams, {
    enabled: step >= 2 && Boolean(availableParams),
  });

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const response = await searchStudents(query);
      setAvailableStudents(response.results ?? []);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        void doSearch(query.trim());
      }, 300);
    },
    [doSearch],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAvailableStudents([]);
      setIsSearching(false);
      return;
    }
    if (searchQuery.trim().length < 2) return;
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const selectedHomeClass = homeClassOptions.find((c) => c.id === homeClassId);
  const targetClass = selectedTarget?.class;
  const targetAvailability = selectedTarget?.availability;

  const canGoStep2 =
    Boolean(studentId) &&
    Boolean(date) &&
    Boolean(homeClassId) &&
    !isCompensationDatePast(date);

  const canGoStep3 = Boolean(selectedTarget);

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setHomeClassId("");
    setSelectedTarget(null);
    setFormError(null);
  };

  const handleNextFromStep1 = () => {
    if (!studentId) {
      setFormError("Select a student");
      return;
    }
    if (!date) {
      setFormError("Select a date");
      return;
    }
    if (isCompensationDatePast(date)) {
      setFormError("Compensation cannot be booked for a past date");
      return;
    }
    if (!homeClassId) {
      setFormError("Select the student's home class");
      return;
    }
    setFormError(null);
    setSelectedTarget(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!selectedTarget) {
      setFormError("Select a target class with available seats");
      return;
    }
    setFormError(null);
    setStep(3);
  };

  const handleSubmit = () => {
    if (!studentId || !homeClassId || !selectedTarget || !date) return;

    const targetClassId = getCompensationRefId(selectedTarget.class);
    if (!targetClassId) {
      setFormError("Invalid target class");
      return;
    }

    createMutation.mutate(
      {
        studentId,
        homeClassId,
        targetClassId,
        date,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (booking) => {
          // Prefer phone from student search if API populate is stale
          const withPhone: CompensationBooking =
            typeof booking.studentId === "object" &&
            booking.studentId &&
            !booking.studentId.phoneNumber &&
            selectedStudent?.phoneNumber
              ? {
                  ...booking,
                  studentId: {
                    ...booking.studentId,
                    phoneNumber: selectedStudent.phoneNumber,
                  },
                }
              : booking;
          setCreatedBooking(withPhone);
          setFormError(null);
          setStep(4);
          onSuccess?.();
        },
      },
    );
  };

  const handleShareWhatsApp = () => {
    if (!createdBooking) return;
    const opened = openCompensationWhatsApp(createdBooking);
    if (!opened) {
      toast.error(
        "Student phone number is missing or invalid. Add it on the student profile.",
      );
    }
  };

  const stepLabel =
    step === 1
      ? "Student & date"
      : step === 2
        ? "Choose class"
        : step === 3
          ? "Confirm"
          : "Share";

  const showWizardChrome = step < 4;

  return (
    <div className="space-y-5">
      {/* Progress */}
      {showWizardChrome && (
        <>
          <div className="flex items-center gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    s < step
                      ? "bg-blue-600 text-white"
                      : s === step
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 flex-1 ${s < step ? "bg-blue-600" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Step {step} of 3 —{" "}
            <span className="font-medium text-gray-900">{stepLabel}</span>
          </p>
        </>
      )}

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student</label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStudent.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedStudent.rollNumber
                      ? `Roll ${selectedStudent.rollNumber}`
                      : selectedStudent.email || "No roll number"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setHomeClassId("");
                    setSearchQuery("");
                    setAvailableStudents([]);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    </div>
                  )}
                </div>
                <div className="max-h-44 overflow-y-auto rounded-md border border-gray-200 p-1.5">
                  {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                      Type at least 2 characters to search
                    </p>
                  ) : availableStudents.length === 0 && !isSearching ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                      No students found for &quot;{searchQuery}&quot;
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {availableStudents.map((student) => {
                        const id = resolveStudentId(student);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleSelectStudent(student)}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-gray-50"
                          >
                            {/* // use profilePicture */}
                            {student.profilePicture ? (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                <Image
                                  src={student.profilePicture}
                                  alt={student.name}
                                  width={32}
                                  height={32}
                                  // webkit available object fill
                                  className="rounded-full h-full w-full object-fill"
                                />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {student.rollNumber
                                  ? `Roll ${student.rollNumber}`
                                  : student.email}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DatePicker
            value={date}
            onChange={(next) => {
              setDate(next);
              setSelectedTarget(null);
              setFormError(null);
            }}
            label="Compensation date"
          />
          {isCompensationDatePast(date) && (
            <p className="text-xs text-red-600">
              Past dates cannot be booked. Pick today or a future date.
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Home class
            </label>
            {!selectedStudent ? (
              <p className="rounded-md border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-500">
                Select a student first
              </p>
            ) : isLoadingStudentDetail ? (
              <p className="rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-500">
                Loading enrolled classes...
              </p>
            ) : homeClassOptions.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                This student is not enrolled in any class
              </p>
            ) : (
              <select
                value={homeClassId}
                onChange={(e) => {
                  setHomeClassId(e.target.value);
                  setSelectedTarget(null);
                  setFormError(null);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select home class...</option>
                {homeClassOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500">
              The class the student normally attends (they missed / need makeup)
            </p>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            <span className="font-medium text-gray-900">
              {selectedStudent?.name}
            </span>
            {" · "}
            {formatDisplayDate(date)}
            {" · from "}
            <span className="font-medium">{selectedHomeClass?.name}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Filter by branch (optional)
            </label>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setSelectedTarget(null);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All branches</option>
              {CLASS_BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  Branch {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Available classes
              </label>
              {(isLoadingAvailable || isFetchingAvailable) && (
                <span className="text-xs text-gray-500">Updating seats...</span>
              )}
            </div>

            {availableError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-center text-sm text-red-700">
                Failed to load available classes. Try again.
              </div>
            ) : isLoadingAvailable ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-10 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                Checking seat availability...
              </div>
            ) : !availableClasses || availableClasses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-3 py-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">
                  No seats available
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  No other classes have free guest seats on this date
                  {branchFilter ? ` in Branch ${branchFilter}` : ""}.
                </p>
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
                {availableClasses.map((item) => {
                  const classId = getCompensationRefId(item.class);
                  const isSelected =
                    getCompensationRefId(selectedTarget?.class) === classId;
                  const schedule = formatClassScheduleSummary(item.class);

                  return (
                    <button
                      key={classId}
                      type="button"
                      onClick={() => {
                        setSelectedTarget(item);
                        setFormError(null);
                      }}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.class.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {item.class.branch
                              ? `Branch ${item.class.branch}`
                              : "No branch"}
                            {schedule ? ` · ${schedule}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.availability.enrolledCount} enrolled ·{" "}
                            {item.availability.confirmedGuestCount} guests
                          </p>
                        </div>
                        <div
                          className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                            item.availability.availableSeats <= 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.availability.availableSeats} left
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selectedTarget && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Booking summary
            </p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Student</dt>
                <dd className="text-right font-medium text-gray-900">
                  {selectedStudent?.name}
                  {selectedStudent?.rollNumber
                    ? ` (${selectedStudent.rollNumber})`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Date</dt>
                <dd className="text-right font-medium text-gray-900">
                  {formatDisplayDate(date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2.5">
                <div className="min-w-0 text-right">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="truncate font-medium text-gray-900">
                    {selectedHomeClass?.name}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-blue-600" />
                <div className="min-w-0 text-left">
                  <p className="text-xs text-gray-500">To</p>
                  <p className="truncate font-medium text-gray-900">
                    {targetClass?.name}
                  </p>
                </div>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-100 pt-2.5">
                <dt className="text-gray-500">Seats after booking</dt>
                <dd className="font-medium text-gray-900">
                  {Math.max(0, (targetAvailability?.availableSeats ?? 1) - 1)}{" "}
                  of {targetAvailability?.sessionCapacity ?? "—"} free
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notes{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Reason for compensation, teacher request, etc."
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">{notes.length}/500</p>
          </div>
        </div>
      )}

      {/* Step 4 — success + WhatsApp */}
      {step === 4 && createdBooking && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Compensation booked
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Share the details with {selectedStudent?.name || "the student"} on
              WhatsApp.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm text-gray-700">
            <p>
              <span className="text-gray-500">Date:</span>{" "}
              {formatDisplayDate(date)}
            </p>
            <p className="mt-1">
              <span className="text-gray-500">Class:</span>{" "}
              {selectedHomeClass?.name} → {targetClass?.name}
            </p>
            {getCompensationWhatsAppPhone(createdBooking) ? (
              <p className="mt-1">
                <span className="text-gray-500">WhatsApp:</span>{" "}
                {typeof createdBooking.studentId === "object"
                  ? createdBooking.studentId.phoneNumber
                  : selectedStudent?.phoneNumber}
              </p>
            ) : (
              <p className="mt-1 text-amber-700">
                No valid phone on this student profile — add one to enable
                WhatsApp share.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {step === 4 ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={() => closeModal()}>
            Done
          </Button>
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={!getCompensationWhatsAppPhone(createdBooking!)}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            Share on WhatsApp
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 1) {
                closeModal();
                return;
              }
              setFormError(null);
              setStep((s) => (s - 1) as Step);
            }}
            disabled={createMutation.isPending}
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={step === 1 ? handleNextFromStep1 : handleNextFromStep2}
              disabled={step === 1 ? !canGoStep2 : !canGoStep3}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? "Booking..." : "Confirm booking"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
