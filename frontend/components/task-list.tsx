'use client';

import { Task } from '@/hooks/use-tasks';
import { DASHBOARD_TASK_CONFIG } from '@/lib/constants';
import { TaskCard } from '@/components/task-card';
import { TaskListSkeleton, EmptyState, ErrorState } from '@/components/dashboard-states';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  error?: Error | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onStatusFilter?: (status: string | null) => void;
  onSortChange?: (sortBy: string) => void;
  onPageChange?: (page: number) => void;
  onAssignTask?: (taskId: string) => Promise<void>;
  onSubmitTask?: (taskId: string) => Promise<void>;
  onRetry?: () => void;
  emptyStateContent?: ReactNode;
}

/**
 * TaskList - Container component for displaying tasks with filtering and sorting
 */
export function TaskList({
  tasks,
  isLoading,
  error,
  pagination,
  viewMode = 'grid',
  onViewModeChange,
  onStatusFilter,
  onSortChange,
  onPageChange,
  onAssignTask,
  onSubmitTask,
  onRetry,
  emptyStateContent,
}: TaskListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');

  const handleStatusChange = (status: string) => {
    const newStatus = status === 'all' ? null : status;
    setSelectedStatus(newStatus);
    onStatusFilter?.(newStatus);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    onSortChange?.(newSort);
  };

  const handleViewModeChange = (newMode: 'grid' | 'list') => {
    onViewModeChange?.(newMode);
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Available Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage tasks available for labeling
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              className="w-full sm:w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={selectedStatus || 'all'}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.entries(DASHBOARD_TASK_CONFIG.STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              className="w-full sm:w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={sortBy}
              onChange={(event) => handleSortChange(event.target.value)}
            >
              <option value="createdAt">Newest</option>
              <option value="updatedAt">Recently Updated</option>
              <option value="reward">Highest Reward</option>
              <option value="requiredLabels">Most Labels Needed</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleViewModeChange('list')}
              title="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to load tasks"
          message={error.message}
          onRetry={onRetry}
        />
      )}

      {/* Tasks Grid/List */}
      {!error && (
        <>
          {isLoading ? (
            // Loading Skeleton
            <TaskListSkeleton count={viewMode === 'grid' ? 6 : 6} />
          ) : tasks.length > 0 ? (
            // Tasks Display
            <>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
              }>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onAssign={onAssignTask}
                    onSubmit={onSubmitTask}
                  />
                ))}
              </div>

              {/* Pagination Info */}
              {pagination && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} tasks
                  </p>

                  {/* Pagination Controls */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange?.(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange?.(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty State
            <EmptyState
              title="No tasks available"
              description={
                selectedStatus ? 'Try adjusting your filters' : 'Tasks will appear here when they are created'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
