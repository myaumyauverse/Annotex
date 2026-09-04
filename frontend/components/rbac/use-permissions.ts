"use client";

import { useAuth } from "@/components/providers/auth-provider";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isAdmin,
  isValidator,
  isContributor,
  canApproveLabels,
  canSubmitLabels,
  canCreateTasks,
  canManagePayouts,
  canViewAnalytics,
} from "@/lib/role-utils";

/**
 * Hook to check permissions within components
 * Usage:
 * const { hasPermission, isAdmin, canCreateTasks } = usePermissions();
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    // Basic checkers
    hasPermission: (permission: string) => hasPermission(role, permission),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(role, permissions),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(role, permissions),

    // Role checkers
    isAdmin: () => isAdmin(role),
    isValidator: () => isValidator(role),
    isContributor: () => isContributor(role),

    // Specific permission checkers
    canApproveLabels: () => canApproveLabels(role),
    canSubmitLabels: () => canSubmitLabels(role),
    canCreateTasks: () => canCreateTasks(role),
    canManagePayouts: () => canManagePayouts(role),
    canViewAnalytics: () => canViewAnalytics(role),

    // User info
    role,
  };
}
