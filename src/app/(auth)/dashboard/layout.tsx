"use client";

import React from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute enforceRoleAccess>
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">{children}</div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
