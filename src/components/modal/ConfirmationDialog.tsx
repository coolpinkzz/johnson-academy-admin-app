"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type DialogType = "info" | "warning" | "success" | "danger";

interface ConfirmationDialogProps {
  type?: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showIcon?: boolean;
}

const dialogConfig = {
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    confirmVariant: "default" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    confirmVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    confirmVariant: "default" as const,
  },
  danger: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    confirmVariant: "destructive" as const,
  },
};

export function ConfirmationDialog({
  type = "info",
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  showIcon = true,
}: ConfirmationDialogProps) {
  const config = dialogConfig[type];
  const IconComponent = config.icon;

  const getDefaultLabels = () => {
    switch (type) {
      case "danger":
        return { confirm: "Delete", cancel: "Cancel" };
      case "success":
        return { confirm: "Confirm", cancel: "Cancel" };
      case "warning":
        return { confirm: "Proceed", cancel: "Cancel" };
      default:
        return { confirm: "OK", cancel: "Cancel" };
    }
  };

  const defaultLabels = getDefaultLabels();

  return (
    <div
      className={`p-6 ${config.bgColor} border ${config.borderColor} rounded-lg`}
    >
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <IconComponent className="h-6 w-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

          <p className="text-sm text-gray-600 mb-4">{message}</p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel} className="px-4 py-2">
              {cancelLabel || defaultLabels.cancel}
            </Button>

            <Button
              variant={config.confirmVariant}
              onClick={onConfirm}
              className="px-4 py-2"
            >
              {confirmLabel || defaultLabels.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function DeleteConfirmation({
  title = "Confirm Deletion",
  message,
  itemName,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message?: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const defaultMessage = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;

  return (
    <ConfirmationDialog
      type="danger"
      title={title}
      message={message || defaultMessage}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export function SuccessDialog({
  title = "Success",
  message,
  onConfirm,
}: {
  title?: string;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      type="success"
      title={title}
      message={message}
      confirmLabel="OK"
      onConfirm={onConfirm}
      onCancel={onConfirm}
    />
  );
}

export function InfoDialog({
  title = "Information",
  message,
  onConfirm,
}: {
  title?: string;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      type="info"
      title={title}
      message={message}
      confirmLabel="OK"
      onConfirm={onConfirm}
      onCancel={onConfirm}
    />
  );
}
