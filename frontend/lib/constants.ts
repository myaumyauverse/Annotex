/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

/**
 * Dashboard Task List Configuration
 */
export const DASHBOARD_TASK_CONFIG = {
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,

  // Task Status Colors (Tailwind)
  STATUS_COLORS: {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    validated: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
  } as const,

  // Task Status Labels
  STATUS_LABELS: {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    validated: 'Validated',
    rejected: 'Rejected',
  } as const,
} as const;

/**
 * RBAC Permissions
 */
export const ROLE_PERMISSIONS = {
  admin: ['create_task', 'edit_task', 'delete_task', 'view_all_users', 'approve_labels', 'trigger_payouts'],
  validator: ['approve_labels', 'reject_labels', 'submit_labels'],
  contributor: ['submit_labels', 'connect_wallet', 'view_earnings'],
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  TASKS: '/tasks',
  TASKS_DETAIL: (id: string) => `/tasks/${id}`,
  TASKS_ASSIGN: (id: string) => `/tasks/${id}/assign`,
  TASKS_UPDATE_STATUS: (id: string) => `/tasks/${id}/status`,
  LABELS: '/labels',
  ANALYTICS: '/analytics',
  ANALYTICS_DASHBOARD: '/analytics/dashboard',
  ANALYTICS_USER_PERFORMANCE: (userId: string) => `/analytics/user/${userId}/performance`,
} as const;
