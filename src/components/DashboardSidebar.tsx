"use client";

import { useAuth } from "@/services/auth";
import {
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  Home,
  Menu,
  Settings,
  Users,
  FileText,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Teachers",
    href: "/dashboard/teachers",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Syllabus",
    href: "/dashboard/syllabus",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Modules",
    href: "/dashboard/modules",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Classes",
    href: "/dashboard/classes",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    title: "Monthly Reports",
    href: "/dashboard/monthly-reports",
    icon: <FileBarChart className="h-4 w-4" />,
  },
  // {
  //   title: "Schedule",
  //   href: "/dashboard/schedule",
  //   icon: <Calendar className="h-4 w-4" />,
  // },
  // {
  //   title: "Assignments",
  //   href: "/dashboard/assignments",
  //   icon: <FileText className="h-4 w-4" />,
  //   badge: "8",
  // },
  // {
  //   title: "Grades",
  //   href: "/dashboard/grades",
  //   icon: <Award className="h-4 w-4" />,
  // },
  // {
  //   title: "Analytics",
  //   href: "/dashboard/analytics",
  //   icon: <BarChart3 className="h-4 w-4" />,
  // },
  // {
  //   title: "Reports",
  //   href: "/dashboard/reports",
  //   icon: <TrendingUp className="h-4 w-4" />,
  // },
  // {
  //   title: "Messages",
  //   href: "/dashboard/messages",
  //   icon: <MessageSquare className="h-4 w-4" />,
  //   badge: "3",
  // },
  // {
  //   title: "Notifications",
  //   href: "/dashboard/notifications",
  //   icon: <Bell className="h-4 w-4" />,
  //   badge: "5",
  // },
  // {
  //   title: "Settings",
  //   href: "/dashboard/settings",
  //   icon: <Settings className="h-4 w-4" />,
  // },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(false); // desktop

  const renderMenuItems = () => (
    <nav className="space-y-1">
      {sidebarItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!collapsed && item.title}
            </div>
            {!collapsed && item.badge && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {item.badge}
              </span>
            )}
            {collapsed && item.badge && (
              <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserSection = () => (
    <div className="border-t p-4 mt-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {user?.name?.charAt(0) || "A"}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
      </div>
      {!collapsed && (
        <button
          onClick={logout}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 m-2 rounded-md hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Johnson Academy</h2>
        </div>
        <div className="flex-1 overflow-auto px-2 py-4">
          {renderMenuItems()}
        </div>
        {renderUserSection()}
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex md:flex-col border-r bg-white h-screen left-0 top-0 transition-all duration-300
          ${collapsed ? "w-16" : "w-60"}`}
      >
        <div className="flex h-16 items-center border-b px-4 justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold">Johnson Academy</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-auto px-2 py-4">
          {renderMenuItems()}
        </div>
        {renderUserSection()}
      </div>
    </>
  );
}
