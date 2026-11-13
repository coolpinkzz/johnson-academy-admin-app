"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { formatRupees } from "@/lib/fees";
import { todayInIndia } from "@/types/compensation";
import type { PaymentType } from "@/types/studentFee";
import { FieldError, FieldHint, FieldLabel, fieldClassName } from "./FormField";
import { PaymentFields } from "./PaymentFields";
import {
  paymentFormSchema,
  toPaymentPayload,
  type PaymentFormValues,
} from "./feeFormSchemas";

type PaymentFormProps = {
  type: PaymentType;
  defaultAmount?: number;
  maxAmount?: number;
  isPending?: boolean;
  onSubmit: (values: { type: PaymentType } & ReturnType<typeof toPaymentPayload>) => Promise<void>;
};

export function PaymentForm({
  type,
  defaultAmount,
  maxAmount,
  isPending = false,
  onSubmit,
}: PaymentFormProps) {
  const { closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema(maxAmount)),
    defaultValues: {
      type,
      payment: {
        amount: defaultAmount && defaultAmount > 0 ? defaultAmount : 0,
        method: "upi",
        reference: "",
        paidAt: todayInIndia(),
        notes: "",
      },
    },
  });

  const busy = isPending || isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ type: values.type, ...toPaymentPayload(values.payment) });
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  });

  const isRefund = type === "refund";

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-4">
        <input type="hidden" {...form.register("type")} />
        {isRefund ? (
          <div>
            <FieldLabel htmlFor="payment-type">Type</FieldLabel>
            <input
              id="payment-type"
              className={fieldClassName}
              value="Refund"
              disabled
              readOnly
            />
            {maxAmount != null ? (
              <FieldHint>Refundable balance: {formatRupees(maxAmount)}</FieldHint>
            ) : null}
          </div>
        ) : null}
        <PaymentFields amountLabel={isRefund ? "Refund amount" : "Amount received"} />
        <FieldError
          id="payment-form-error"
          message={form.formState.errors.payment?.amount?.message}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeModal()}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : isRefund ? "Record refund" : "Record payment"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
