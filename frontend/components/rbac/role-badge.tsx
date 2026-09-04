"use client";

import type { UserRole } from "@/lib/types";
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/role-utils";

interface RoleBadgeProps {
  role: UserRole | undefined | null;
  size?: "sm" | "md" | "lg";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  if (!role) return null;

  const displayName = getRoleDisplayName(role);
  const colorClasses = getRoleBadgeColor(role);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <div className={`rounded-full border font-semibold ${colorClasses} ${sizeClasses[size]}`}>
      {displayName}
    </div>
  );
}

interface RoleIndicatorProps {
  role: UserRole | undefined | null;
}

export function RoleIndicator({ role }: RoleIndicatorProps) {
  if (!role) return null;

  const icons: Record<UserRole, string> = {
    admin: "[A]",
    validator: "[V]",
    contributor: "[C]",
  };

  return <span className="text-lg">{icons[role]}</span>;
}
