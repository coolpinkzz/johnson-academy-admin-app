"use client";

import { Controller, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/DatePicker";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/types/studentFee";
import { FieldError, FieldLabel, fieldClassName } from "./FormField";
import type { PaymentFieldsForm } from "./feeFormSchemas";

/** Amount, method, reference, date and notes for a payment, registered under `payment.*`. */
export function PaymentFields({ amountLabel = "Amount received" }: { amountLabel?: string }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PaymentFieldsForm>();
  const paymentErrors = errors.payment;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel htmlFor="payment-amount">{amountLabel} (₹)</FieldLabel>
        <input
          id="payment-amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className={fieldClassName}
          aria-invalid={Boolean(paymentErrors?.amount)}
          aria-describedby="payment-amount-error"
          {...register("payment.amount", { valueAsNumber: true })}
        />
        <FieldError id="payment-amount-error" message={paymentErrors?.amount?.message} />
      </div>

      <div>
        <FieldLabel htmlFor="payment-method">Payment method</FieldLabel>
        <select
          id="payment-method"
          className={fieldClassName}
          aria-invalid={Boolean(paymentErrors?.method)}
          aria-describedby="payment-method-error"
          {...register("payment.method")}
        >
          <option value="">Select method…</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
        <FieldError id="payment-method-error" message={paymentErrors?.method?.message} />
      </div>

      <div>
        <FieldLabel htmlFor="payment-reference" optional>
          Transaction ID
        </FieldLabel>
        <input
          id="payment-reference"
          type="text"
          placeholder="e.g. GP/2903/73100"
          autoComplete="off"
          className={fieldClassName}
          aria-invalid={Boolean(paymentErrors?.reference)}
          aria-describedby="payment-reference-error"
          {...register("payment.reference")}
        />
        <FieldError
          id="payment-reference-error"
          message={paymentErrors?.reference?.message}
        />
      </div>

      <div>
        <Controller
          control={control}
          name="payment.paidAt"
          render={({ field }) => (
            <DatePicker value={field.value ?? ""} onChange={field.onChange} label="Paid on" />
          )}
        />
        <FieldError id="payment-paid-at-error" message={paymentErrors?.paidAt?.message} />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="payment-notes" optional>
          Payment note
        </FieldLabel>
        <input
          id="payment-notes"
          type="text"
          maxLength={500}
          className={fieldClassName}
          aria-invalid={Boolean(paymentErrors?.notes)}
          aria-describedby="payment-notes-error"
          {...register("payment.notes")}
        />
        <FieldError id="payment-notes-error" message={paymentErrors?.notes?.message} />
      </div>
    </div>
  );
}
