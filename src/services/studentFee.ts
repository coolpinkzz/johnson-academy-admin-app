import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ServerResponse } from "@/models/common/client";
import { getApiErrorMessage } from "@/lib/utils";
import type {
  CreatePackagePayload,
  FeePackage,
  PaymentPayload,
  StudentFees,
  UpdatePackagePayload,
} from "@/types/studentFee";
import { AuthService } from "./auth";
import { client } from "./api-client";

const STUDENT_FEES_KEY = "student-fees";

function authHeaders() {
  return {
    Authorization: `Bearer ${AuthService.getAccessToken()}`,
  };
}

export const studentFeesQueryKey = (studentId: string) =>
  [STUDENT_FEES_KEY, "student", studentId] as const;

export const getStudentFees = async (
  studentId: string,
): Promise<StudentFees> => {
  const response: ServerResponse<StudentFees> = await client(
    `/student-fees/students/${studentId}`,
    { method: "GET", headers: authHeaders() },
  );
  return response as unknown as StudentFees;
};

export const useStudentFees = (
  studentId: string,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};
  return useQuery<StudentFees>({
    queryKey: studentFeesQueryKey(studentId),
    queryFn: () => getStudentFees(studentId),
    enabled: enabled && Boolean(studentId),
  });
};

const createPackage = async (
  payload: CreatePackagePayload,
): Promise<FeePackage> => {
  const response: ServerResponse<FeePackage> = await client(
    `/student-fees/packages`,
    { method: "POST", headers: authHeaders(), data: payload },
  );
  return response as unknown as FeePackage;
};

const updatePackage = async ({
  packageId,
  payload,
}: {
  packageId: string;
  payload: UpdatePackagePayload;
}): Promise<FeePackage> => {
  const response: ServerResponse<FeePackage> = await client(
    `/student-fees/packages/${packageId}`,
    { method: "PATCH", headers: authHeaders(), data: payload },
  );
  return response as unknown as FeePackage;
};

const cancelPackage = async ({
  packageId,
  reason,
}: {
  packageId: string;
  reason: string;
}): Promise<FeePackage> => {
  const response: ServerResponse<FeePackage> = await client(
    `/student-fees/packages/${packageId}/cancel`,
    { method: "POST", headers: authHeaders(), data: { reason } },
  );
  return response as unknown as FeePackage;
};

const addPayment = async ({
  packageId,
  payload,
}: {
  packageId: string;
  payload: PaymentPayload;
}): Promise<FeePackage> => {
  const response: ServerResponse<FeePackage> = await client(
    `/student-fees/packages/${packageId}/payments`,
    { method: "POST", headers: authHeaders(), data: payload },
  );
  return response as unknown as FeePackage;
};

const voidPayment = async ({
  paymentId,
  reason,
}: {
  paymentId: string;
  reason: string;
}): Promise<FeePackage> => {
  const response: ServerResponse<FeePackage> = await client(
    `/student-fees/payments/${paymentId}/void`,
    { method: "POST", headers: authHeaders(), data: { reason } },
  );
  return response as unknown as FeePackage;
};

/** Mutation that refreshes all fee queries and toasts on success/failure. */
function useFeeMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<FeePackage>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_FEES_KEY] });
      toast.success(messages.success);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, messages.error));
    },
  });
}

export const useCreatePackage = () =>
  useFeeMutation(createPackage, {
    success: "Package added",
    error: "Failed to add package",
  });

export const useUpdatePackage = () =>
  useFeeMutation(updatePackage, {
    success: "Package updated",
    error: "Failed to update package",
  });

export const useCancelPackage = () =>
  useFeeMutation(cancelPackage, {
    success: "Package cancelled",
    error: "Failed to cancel package",
  });

export const useAddPayment = () =>
  useFeeMutation(addPayment, {
    success: "Payment recorded",
    error: "Failed to record payment",
  });

export const useVoidPayment = () =>
  useFeeMutation(voidPayment, {
    success: "Payment voided",
    error: "Failed to void payment",
  });
