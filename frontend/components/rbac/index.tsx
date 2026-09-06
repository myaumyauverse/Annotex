"use client";

import type { UserRole } from "@/lib/types";
import { hasPermission, hasAllPermissions, hasAnyPermission } from "@/lib/role-utils";

/**
 * Only render children if user has the specified permission
 */
export function RequirePermission({
  permission,
  role,
  fallback,
  children,
}: {
  permission: string;
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (hasPermission(role, permission)) {
    return <>{children}</>;
  }
  return fallback ?? null;
}

/**
 * Only render children if user has ALL specified permissions
 */
export function RequireAllPermissions({
  permissions,
  role,
  fallback,
  children,
}: {
  permissions: string[];
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (hasAllPermissions(role, permissions)) {
    return <>{children}</>;
  }
  return fallback ?? null;
}

/**
 * Only render children if user has ANY of the specified permissions
 */
export function RequireAnyPermission({
  permissions,
  role,
  fallback,
  children,
}: {
  permissions: string[];
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (hasAnyPermission(role, permissions)) {
    return <>{children}</>;
  }
  return fallback ?? null;
}

/**
 * Only render children if user has specified role
 */
export function RequireRole({
  roles,
  role,
  fallback,
  children,
}: {
  roles: UserRole | UserRole[];
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const roleList = Array.isArray(roles) ? roles : [roles];
  if (role && roleList.includes(role)) {
    return <>{children}</>;
  }
  return fallback ?? null;
}

/**
 * Render children only for admin users
 */
export function AdminOnly({
  role,
  fallback,
  children,
}: {
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      role={role}
      roles="admin"
      fallback={fallback}
    >
      {children}
    </RequireRole>
  );
}

/**
 * Render children only for contributor users
 */
export function ContributorOnly({
  role,
  fallback,
  children,
}: {
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      role={role}
      roles="contributor"
      fallback={fallback}
    >
      {children}
    </RequireRole>
  );
}

/**
 * Render children only for validator users
 */
export function ValidatorOnly({
  role,
  fallback,
  children,
}: {
  role: UserRole | undefined | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      role={role}
      roles="validator"
      fallback={fallback}
    >
      {children}
    </RequireRole>
  );
}

/**
 * Show different content based on user role
 */
export function RoleBasedContent({
  role,
  admin,
  validator,
  contributor,
  default: defaultContent,
}: {
  role: UserRole | undefined | null;
  admin?: React.ReactNode;
  validator?: React.ReactNode;
  contributor?: React.ReactNode;
  default?: React.ReactNode;
}) {
  if (role === "admin" && admin !== undefined) return <>{admin}</>;
  if (role === "validator" && validator !== undefined) return <>{validator}</>;
  if (role === "contributor" && contributor !== undefined) return <>{contributor}</>;
  return defaultContent ?? null;
}
