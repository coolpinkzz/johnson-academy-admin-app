"use client";

import AuthService, { useAuth } from "@/services/auth";
import {
  canAccessPath,
  getDefaultRouteForRole,
  isStaffRole,
} from "@/lib/rbac";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When true, also enforce staff role + module path access (dashboard routes). */
  enforceRoleAccess?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  enforceRoleAccess = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!enforceRoleAccess) return;

    if (!isStaffRole(user?.role)) {
      AuthService.clearAuth();
      router.replace("/login");
      return;
    }

    if (!canAccessPath(user.role, pathname)) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isAuthenticated, isLoading, enforceRoleAccess, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (enforceRoleAccess) {
    if (!isStaffRole(user?.role) || !canAccessPath(user.role, pathname)) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
