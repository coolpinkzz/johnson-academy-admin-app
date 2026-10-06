import { cn } from "@/lib/utils";
import type { PaymentStatus, RenewalStatus } from "@/types/studentFee";

const badgeBase =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

const RENEWAL_BADGES: Record<RenewalStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800" },
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  expiring: { label: "Expiring soon", className: "bg-amber-100 text-amber-800" },
  expired: { label: "Expired", className: "bg-red-100 text-red-800" },
};

const PAYMENT_BADGES: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-green-100 text-green-800" },
  partial: { label: "Partially paid", className: "bg-amber-100 text-amber-800" },
  unpaid: { label: "Unpaid", className: "bg-red-100 text-red-800" },
  overpaid: { label: "Overpaid", className: "bg-purple-100 text-purple-800" },
};

/** `status` null = cancelled package */
export function RenewalStatusBadge({ status }: { status: RenewalStatus | null }) {
  const badge = status
    ? RENEWAL_BADGES[status]
    : { label: "Cancelled", className: "bg-gray-100 text-gray-700" };
  return <span className={cn(badgeBase, badge.className)}>{badge.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const badge = PAYMENT_BADGES[status];
  return <span className={cn(badgeBase, badge.className)}>{badge.label}</span>;
}
