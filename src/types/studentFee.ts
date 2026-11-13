export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "overpaid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RENEWAL_STATUSES = [
  "upcoming",
  "active",
  "expiring",
  "expired",
] as const;
export type RenewalStatus = (typeof RENEWAL_STATUSES)[number];

export const PAYMENT_METHODS = [
  "upi",
  "card",
  "card_machine",
  "cash",
  "bank_transfer",
  "cheque",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  card_machine: "Card machine",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  other: "Other",
};

export type PaymentType = "payment" | "refund";
export type PaymentRecordStatus = "completed" | "voided";
export type PackageState = "valid" | "cancelled";

export const DURATION_PRESETS = [1, 4, 6, 12] as const;
export const MAX_DURATION_MONTHS = 36;

/** Dates are ISO strings at UTC midnight of the calendar day; amounts are whole rupees. */
export interface FeePayment {
  id: string;
  packageId: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  status: PaymentRecordStatus;
  notes: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  recordedBy: { id: string; name: string } | null;
}

export interface FeeCourse {
  id: string;
  name: string;
  instrument: string | null;
}

export interface FeePackage {
  id: string;
  studentId: string;
  course: FeeCourse | null;
  startDate: string;
  endDate: string;
  durationMonths: number;
  amount: number;
  amountPaid: number;
  amountRefunded: number;
  balance: number;
  paymentStatus: PaymentStatus;
  state: PackageState;
  renewalStatus: RenewalStatus | null;
  daysRemaining: number;
  renewalOfId: string | null;
  notes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  payments: FeePayment[];
}

export interface FeeStudent {
  id: string;
  name: string;
  email: string | null;
  rollNumber: string | null;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface StudentFees {
  student: FeeStudent;
  packages: FeePackage[];
}

export interface PaymentPayload {
  type?: PaymentType;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  /** YYYY-MM-DD */
  paidAt?: string;
  notes?: string;
}

export interface CreatePackagePayload {
  studentId: string;
  courseId: string;
  startDate: string;
  durationMonths: number;
  endDate?: string;
  amount: number;
  renewalOfId?: string;
  notes?: string;
  initialPayment?: Omit<PaymentPayload, "type">;
}

export type UpdatePackagePayload = Partial<{
  startDate: string;
  durationMonths: number;
  endDate: string;
  amount: number;
  notes: string;
}>;

/** Net amount that can still be refunded on a package. */
export function getRefundableAmount(pkg: FeePackage): number {
  return pkg.amountPaid - pkg.amountRefunded;
}
