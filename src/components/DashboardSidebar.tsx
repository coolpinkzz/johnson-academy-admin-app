"use client";

import { useAuth } from "@/services/auth";
import {
  ArrowLeftRight,
  BookOpen,
  GraduationCap,
  Home,
  Users,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  BarChart3,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import logoImage from "@/assets/logo.png";
import {
  DashboardModule,
  getNavModulesForRole,
  MODULE_ROUTES,
} from "@/lib/rbac";

interface SidebarChild {
  title: string;
  href: string;
}

interface SidebarItem {
  title: string;
  module: DashboardModule;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: SidebarChild[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    module: "dashboard",
    href: MODULE_ROUTES.dashboard,
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Students",
    module: "students",
    href: MODULE_ROUTES.students,
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Teachers",
    module: "teachers",
    href: MODULE_ROUTES.teachers,
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Courses",
    module: "courses",
    href: MODULE_ROUTES.courses,
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Syllabus",
    module: "syllabus",
    href: MODULE_ROUTES.syllabus,
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Modules",
    module: "modules",
    href: MODULE_ROUTES.modules,
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Classes",
    module: "classes",
    href: MODULE_ROUTES.classes,
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    title: "Attendance",
    module: "attendance",
    href: MODULE_ROUTES.attendance,
    icon: <Clock className="h-4 w-4" />,
  },
  {
    title: "Compensation",
    module: "compensation",
    href: MODULE_ROUTES.compensation,
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  {
    title: "Monthly Reports",
    module: "monthly-reports",
    href: MODULE_ROUTES["monthly-reports"],
    icon: <FileBarChart className="h-4 w-4" />,
  },
  {
    title: "MRT Dashboard",
    module: "mrt-reporting",
    href: MODULE_ROUTES["mrt-reporting"],
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { title: "MRT Dashboard", href: MODULE_ROUTES["mrt-reporting"] },
      { title: "Leaderboard", href: `${MODULE_ROUTES["mrt-reporting"]}/leaderboard` },
    ],
  },
  {
    title: "Manage Team",
    module: "manage-team",
    href: MODULE_ROUTES["manage-team"],
    icon: <UserCog className="h-4 w-4" />,
  },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const visibleItems = useMemo(() => {
    const allowed = new Set(getNavModulesForRole(user?.role));
    return sidebarItems.filter((item) => allowed.has(item.module));
  }, [user?.role]);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isChildActive = (parentHref: string, childHref: string) => {
    if (childHref === parentHref) {
      return pathname === childHref;
    }
    return pathname === childHref || pathname.startsWith(`${childHref}/`);
  };

  const renderMenuItems = (compact: boolean) => (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const isActive = isItemActive(item.href);
        const hasChildren = Boolean(item.children?.length);
        const groupOpen = openGroups[item.module] ?? isActive;
        const itemClass = `flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-100 text-blue-600"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`;

        if (hasChildren && !compact) {
          return (
            <div key={item.href}>
              <button
                type="button"
                aria-expanded={groupOpen}
                className={itemClass}
                onClick={() =>
                  setOpenGroups((current) => ({
                    ...current,
                    [item.module]: !groupOpen,
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.title}
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${groupOpen ? "rotate-180" : ""}`}
                />
              </button>
              {groupOpen ? (
                <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-2">
                  {item.children?.map((child) => {
                    const childActive = isChildActive(item.href, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          childActive
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={itemClass}
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!compact && item.title}
            </div>
            {!compact && item.badge && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {item.badge}
              </span>
            )}
            {compact && item.badge && (
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
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.role ? `${user.role} · ${user.email}` : user?.email}
            </p>
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
          <Image
            src={logoImage}
            alt="Johnson Academy Logo"
            width={100}
            height={100}
          />
        </div>
        <div className="flex-1 overflow-auto px-2 py-4">
          {renderMenuItems(false)}
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
            <div className="flex items-center gap-2">
              <Image
                src={logoImage}
                alt="Johnson Academy Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
              <h2 className="text-sm font-medium">Johnson Academy</h2>
            </div>
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
          {renderMenuItems(collapsed)}
        </div>
        {renderUserSection()}
      </div>
    </>
  );
}
