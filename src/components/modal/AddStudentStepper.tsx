"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";
import { StudentForm } from "@/components/modal/StudentForm";
import { PackageForm } from "@/components/fees/PackageForm";
import { AssignClassStep } from "@/components/modal/AssignClassStep";
import { useCreatePackage } from "@/services/studentFee";
import { useModal } from "@/hooks/use-modal";
import { formatAdmissionDate } from "@/lib/admission";

const STEPS = [
  { label: "Admission", hint: "Student details" },
  { label: "Package", hint: "Fees" },
  { label: "Class", hint: "Enrollment" },
] as const;

type CreatedStudent = {
  id: string;
  name: string;
  dateOfJoining: string;
};

type CreatedPackage = {
  courseId: string;
  courseName: string;
};

export function AddStudentStepper() {
  const { closeModal } = useModal();
  const createPackage = useCreatePackage();
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState<CreatedStudent | null>(null);
  const [feePackage, setFeePackage] = useState<CreatedPackage | null>(null);

  const finish = (message: string) => {
    toast.success(message);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-3 gap-3">
        {STEPS.map((item, index) => {
          const complete = index < step;
          const current = index === step;
          return (
            <li
              key={item.label}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${
                current
                  ? "border-blue-600 bg-blue-50"
                  : complete
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  current
                    ? "bg-blue-600 text-white"
                    : complete
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {complete ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-gray-500">Step {index + 1}</span>
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {item.label}
                </span>
                <span className="hidden text-xs text-gray-500 sm:block">{item.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {student ? (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{student.name}</span>
          {student.dateOfJoining
            ? ` · joined ${formatAdmissionDate(student.dateOfJoining)}`
            : ""}
          {feePackage ? ` · ${feePackage.courseName}` : ""}
        </p>
      ) : null}

      {step === 0 ? (
        <div className="mx-auto max-w-xl">
          <StudentForm
            type="student"
            submitLabel="Save and continue"
            onStudentCreated={(created) => {
              setStudent(created);
              setStep(1);
            }}
          />
        </div>
      ) : null}

      {step === 1 && student ? (
        <div className="mx-auto max-w-2xl">
          <PackageForm
            studentId={student.id}
            defaultStartDate={student.dateOfJoining}
            description={`Add the fee package for ${student.name}. The start date matches their joining date.`}
            cancelLabel="Skip package"
            submitLabel="Save and continue"
            onCancel={() => setStep(2)}
            onCreate={async (payload) => {
              await createPackage.mutateAsync(payload);
            }}
            onFinished={(info) => {
              setFeePackage(info);
              setStep(2);
            }}
          />
        </div>
      ) : null}

      {step === 2 && student ? (
        <AssignClassStep
          studentId={student.id}
          studentName={student.name}
          courseId={feePackage?.courseId}
          courseName={feePackage?.courseName}
          onDone={() => closeModal()}
          onSkip={() =>
            finish(
              feePackage
                ? `${student.name} was saved with a package. Add a class later from Classes.`
                : `${student.name} was saved. Add a package or class later from their profile.`,
            )
          }
        />
      ) : null}
    </div>
  );
}
