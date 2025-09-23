// src/app/(auth)/dashboard/layout.tsx
//add dashboard sidebar here

import React from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">{children}</div>
    </div>
  );
};

export default DashboardLayout;
