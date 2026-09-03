import type { UserRole } from "@/lib/types";

/**
 * Role hierarchy utilities for role-based access control (RBAC)
 */

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "view_dashboard",
    "create_task",
    "edit_task",
    "delete_task",
    "view_all_users",
    "view_all_labels",
    "approve_labels",
    "reject_labels",
    "trigger_payouts",
    "view_analytics",
    "manage_users",
    "export_data",
  ],
  validator: [
    "view_dashboard",
    "view_assigned_tasks",
    "approve_labels",
    "reject_labels",
    "view_task_labels",
    "view_analytics",
  ],
  contributor: [
    "view_dashboard",
    "view_available_tasks",
    "submit_labels",
    "view_own_performance",
    "connect_wallet",
    "view_earnings",
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole | undefined | null, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has all specified permissions
 */
export function hasAllPermissions(role: UserRole | undefined | null, permissions: string[]): boolean {
  if (!role) return false;
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | undefined | null, permissions: string[]): boolean {
  if (!role) return false;
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

/**
 * Check if user is a validator
 */
export function isValidator(role: UserRole | undefined | null): boolean {
  return role === "validator";
}

/**
 * Check if user is a contributor
 */
export function isContributor(role: UserRole | undefined | null): boolean {
  return role === "contributor";
}

/**
 * Check if user can approve labels
 */
export function canApproveLabels(role: UserRole | undefined | null): boolean {
  return hasAnyPermission(role, ["approve_labels"]);
}

/**
 * Check if user can submit labels
 */
export function canSubmitLabels(role: UserRole | undefined | null): boolean {
  return hasPermission(role, "submit_labels");
}

/**
 * Check if user can create tasks
 */
export function canCreateTasks(role: UserRole | undefined | null): boolean {
  return hasPermission(role, "create_task");
}

/**
 * Check if user can manage payouts
 */
export function canManagePayouts(role: UserRole | undefined | null): boolean {
  return hasPermission(role, "trigger_payouts");
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(role: UserRole | undefined | null): boolean {
  return hasPermission(role, "view_analytics");
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole | undefined | null): string {
  const displayNames: Record<UserRole, string> = {
    admin: "Administrator",
    validator: "Validator",
    contributor: "Contributor",
  };
  return role ? displayNames[role] : "Unknown";
}

/**
 * Get role badge color for UI display
 */
export function getRoleBadgeColor(role: UserRole | undefined | null): string {
  const colors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800 border-red-300",
    validator: "bg-purple-100 text-purple-800 border-purple-300",
    contributor: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return role ? colors[role] : "bg-gray-100 text-gray-800 border-gray-300";
}
