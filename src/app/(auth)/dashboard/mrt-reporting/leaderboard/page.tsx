"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { MrtLeaderboardPage } from "@/components/mrt-reporting/MrtLeaderboardPage";

export default function MrtLeaderboardRoute() {
  return (
    <ProtectedRoute>
      <MrtLeaderboardPage />
    </ProtectedRoute>
  );
}
