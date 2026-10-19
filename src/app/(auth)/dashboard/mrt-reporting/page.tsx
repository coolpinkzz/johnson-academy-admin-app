"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { MrtDashboard } from "@/components/mrt-reporting/MrtDashboard";

export default function MrtReportingPage() {
  return (
    <ProtectedRoute>
      <MrtDashboard />
    </ProtectedRoute>
  );
}
