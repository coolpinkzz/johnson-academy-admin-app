/**
 * Admin portal RBAC — mirrors johnson-academy-be Admin Dashboard matrix.
 *
 * | Module          | admin | aqsd | master |
 * |-----------------|-------|------|--------|
 * | Dashboard       | ✓     |      | ✓      |
 * | Students        | ✓     | ✓    | ✓      |
 * | Teachers        | ✓     |      | ✓      |
 * | Courses         |       | ✓    | ✓      |
 * | Syllabus        |       | ✓    | ✓      |
 * | Modules         |       | ✓    | ✓      |
 * | Classes         | ✓     |      | ✓      |
 * | Attendance      | ✓     | ✓    | ✓      |
 * | Monthly Reports | ✓     | ✓    | ✓      |
 * | Compensation    | ✓     |      | ✓      |
 * | Notice Board    |       |      | ✓      |
 * | Manage Team     |       |      | ✓      |
 */

export const STAFF_ROLES = ["admin", "aqsd", "master"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type DashboardModule =
  | "dashboard"
  | "students"
  | "teachers"
  | "courses"
  | "syllabus"
  | "modules"
  | "classes"
  | "attendance"
  | "monthly-reports"
  | "compensation"
  | "notice-board"
  | "manage-team";

export const MODULE_ROUTES: Record<DashboardModule, string> = {
  dashboard: "/dashboard",
  students: "/dashboard/students",
  teachers: "/dashboard/teachers",
  courses: "/dashboard/courses",
  syllabus: "/dashboard/syllabus",
  modules: "/dashboard/modules",
  classes: "/dashboard/classes",
  attendance: "/dashboard/attendance",
  "monthly-reports": "/dashboard/monthly-reports",
  compensation: "/dashboard/compensation",
  "notice-board": "/dashboard/notice-board",
  "manage-team": "/dashboard/manage-team",
};

export const ROLE_MODULES: Record<StaffRole, readonly DashboardModule[]> = {
  admin: [
    "dashboard",
    "students",
    "teachers",
    "classes",
    "attendance",
    "monthly-reports",
    "compensation",
  ],
  aqsd: [
    "students",
    "courses",
    "syllabus",
    "modules",
    "attendance",
    "monthly-reports",
  ],
  master: [
    "dashboard",
    "students",
    "teachers",
    "courses",
    "syllabus",
    "modules",
    "classes",
    "attendance",
    "monthly-reports",
    "compensation",
    "notice-board",
    "manage-team",
  ],
};

/** Modules that currently have UI pages (notice-board is rights-only for now). */
export const NAV_MODULES: readonly DashboardModule[] = [
  "dashboard",
  "students",
  "teachers",
  "courses",
  "syllabus",
  "modules",
  "classes",
  "attendance",
  "compensation",
  "monthly-reports",
  "manage-team",
];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function getModulesForRole(role: string | undefined | null): readonly DashboardModule[] {
  if (!isStaffRole(role)) return [];
  return ROLE_MODULES[role];
}

export function canAccessModule(
  role: string | undefined | null,
  module: DashboardModule
): boolean {
  return getModulesForRole(role).includes(module);
}

/**
 * Map a dashboard pathname to its module key.
 * Exact `/dashboard` → dashboard; nested paths match by prefix.
 */
export function getModuleFromPath(pathname: string): DashboardModule | null {
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/dashboard") return "dashboard";

  const entries = (Object.entries(MODULE_ROUTES) as [DashboardModule, string][])
    .filter(([dashboardModule]) => dashboardModule !== "dashboard")
    .sort((a, b) => b[1].length - a[1].length);

  for (const [dashboardModule, route] of entries) {
    if (path === route || path.startsWith(`${route}/`)) {
      return dashboardModule;
    }
  }

  return null;
}

export function canAccessPath(role: string | undefined | null, pathname: string): boolean {
  if (!isStaffRole(role)) return false;

  const dashboardModule = getModuleFromPath(pathname);
  if (!dashboardModule) {
    // Unknown dashboard subpaths (e.g. /dashboard/test) — deny
    return false;
  }

  return canAccessModule(role, dashboardModule);
}

/** First allowed nav route for a staff role (aqsd has no dashboard). */
export function getDefaultRouteForRole(role: string | undefined | null): string {
  if (!isStaffRole(role)) return "/login";

  const allowed = getModulesForRole(role);
  const firstNav = NAV_MODULES.find((dashboardModule) => allowed.includes(dashboardModule));
  return firstNav ? MODULE_ROUTES[firstNav] : "/login";
}

export function getNavModulesForRole(role: string | undefined | null): DashboardModule[] {
  const allowed = getModulesForRole(role);
  return NAV_MODULES.filter((dashboardModule) => allowed.includes(dashboardModule));
}

/** Packages & payments (BE rights getStudentFees / manageStudentFees). */
const STUDENT_FEE_ROLES: readonly StaffRole[] = ["admin", "master"];

export function canManageStudentFees(role: string | undefined | null): boolean {
  return isStaffRole(role) && STUDENT_FEE_ROLES.includes(role);
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  aqsd: "AQSD",
  master: "Master",
};
