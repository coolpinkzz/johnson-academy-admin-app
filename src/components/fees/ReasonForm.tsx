"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { FieldError, FieldLabel, fieldClassName } from "./FormField";
import { reasonSchema, type ReasonFormValues } from "./feeFormSchemas";

type ReasonFormProps = {
  submitLabel: string;
  pendingLabel?: string;
  description?: string;
  isPending?: boolean;
  onSubmit: (reason: string) => Promise<void>;
};

export function ReasonForm({
  submitLabel,
  pendingLabel = "Saving…",
  description,
  isPending = false,
  onSubmit,
}: ReasonFormProps) {
  const { closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  const busy = isPending || isSubmitting;

  const submit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values.reason.trim());
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      <div>
        <FieldLabel htmlFor="fee-reason">Reason</FieldLabel>
        <textarea
          id="fee-reason"
          rows={3}
          maxLength={500}
          className={fieldClassName}
          aria-invalid={Boolean(errors.reason)}
          aria-describedby="fee-reason-error"
          placeholder="Why is this change needed?"
          {...register("reason")}
        />
        <FieldError id="fee-reason-error" message={errors.reason?.message} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => closeModal()} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
