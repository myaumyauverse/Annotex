/**
 * Dashboard-specific types
 */

import { Task, Label } from '@/hooks/use-tasks';

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  validatedTasks: number;
}

export interface AdminDashboardStats extends DashboardStats {
  totalContributors: number;
  averageAccuracy: number;
  consensusRate: number;
}

export interface ValidatorDashboardStats extends DashboardStats {
  pendingReviews: number;
  totalReviewed: number;
  averageAccuracy: number;
}

export interface ContributorDashboardStats extends DashboardStats {
  inProgressTasks: number;
  totalEarnings: number;
  accuracyRate: number;
}

export interface ActivityCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  action?: {
    label: string;
    href: string;
  };
}

export interface TaskListFilters {
  status?: Task['status'];
  sortBy?: 'createdAt' | 'reward' | 'requiredLabels' | 'updatedAt';
  page?: number;
  limit?: number;
}

export interface TaskListState {
  filters: TaskListFilters;
  selectedTask?: Task;
}

/**
 * Export Task and Label from hooks for convenience
 */
export type { Task, Label };
