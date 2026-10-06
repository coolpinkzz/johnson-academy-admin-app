import { z } from "zod";
import {
  MAX_DURATION_MONTHS,
  PAYMENT_METHODS,
  type PaymentPayload,
} from "@/types/studentFee";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const paymentFieldsSchema = z.object({
  amount: z
    .number({ error: "Enter the amount" })
    .int("Whole rupees only")
    .min(1, "Amount must be at least ₹1"),
  method: z.enum(PAYMENT_METHODS, { error: "Select a payment method" }),
  reference: z.string().trim().max(100, "Keep the reference under 100 characters"),
  paidAt: z.string().regex(YMD, "Select the payment date"),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
});

export type PaymentFieldValues = z.input<typeof paymentFieldsSchema>;
export type PaymentFieldOutput = z.output<typeof paymentFieldsSchema>;

/** Shape shared by every form that renders <PaymentFields /> */
export type PaymentFieldsForm = { payment?: PaymentFieldValues };

export function toPaymentPayload(
  payment: PaymentFieldOutput,
): Omit<PaymentPayload, "type"> {
  return {
    amount: payment.amount,
    method: payment.method,
    paidAt: payment.paidAt,
    ...(payment.reference ? { reference: payment.reference } : {}),
    ...(payment.notes ? { notes: payment.notes } : {}),
  };
}

export const packageFormSchema = z
  .object({
    courseId: z.string().min(1, "Select a course"),
    startDate: z.string().regex(YMD, "Select a start date"),
    durationMonths: z
      .number({ error: "Enter the number of months" })
      .int("Whole months only")
      .min(1, "At least 1 month")
      .max(MAX_DURATION_MONTHS, `At most ${MAX_DURATION_MONTHS} months`),
    customEndDate: z.boolean(),
    /** Unregistered (undefined) unless customEndDate is on */
    endDate: z.string().regex(YMD, "Select an end date").optional(),
    amount: z
      .number({ error: "Enter the package amount" })
      .int("Whole rupees only")
      .min(0, "Amount cannot be negative"),
    notes: z.string().trim().max(500, "Keep notes under 500 characters"),
    recordPayment: z.boolean(),
    /** Unregistered (undefined) unless recordPayment is on */
    payment: paymentFieldsSchema.optional(),
  })
  .superRefine((values, ctx) => {
    if (values.customEndDate) {
      if (!values.endDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "Select an end date" });
      } else if (values.endDate < values.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date must be on or after the start date",
        });
      }
    }
    if (values.recordPayment && !values.payment) {
      ctx.addIssue({
        code: "custom",
        path: ["payment", "amount"],
        message: "Enter the payment details",
      });
    }
  });

export type PackageFormValues = z.input<typeof packageFormSchema>;
export type PackageFormOutput = z.output<typeof packageFormSchema>;

export const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Give a short reason (at least 3 characters)")
    .max(500, "Keep the reason under 500 characters"),
});

export type ReasonFormValues = z.input<typeof reasonSchema>;

export function paymentFormSchema(maxAmount?: number) {
  return z
    .object({
      type: z.enum(["payment", "refund"]),
      payment: paymentFieldsSchema,
    })
    .superRefine((values, ctx) => {
      if (maxAmount == null || values.payment.amount <= maxAmount) return;
      ctx.addIssue({
        code: "custom",
        path: ["payment", "amount"],
        message:
          values.type === "refund"
            ? `Refund cannot exceed ${maxAmount}`
            : `Amount cannot exceed ${maxAmount}`,
      });
    });
}

export type PaymentFormValues = {
  type: "payment" | "refund";
  payment: PaymentFieldValues;
};
