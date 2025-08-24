// src/app/(auth)/dashboard/layout.tsx
//add dashboard sidebar here

import React from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      {children}
    </div>
  );
};

export default DashboardLayout;
