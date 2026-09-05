'use client';

/**
 * TaskSkeleton - Skeleton loading component for individual task cards
 * Used when data is being fetched to provide visual feedback
 */
export function TaskSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-4 animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>

      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Dataset skeleton */}
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>

      {/* Metadata grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Progress skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

/**
 * TaskListSkeleton - Skeleton loading for entire task list/grid
 * Shows multiple skeleton cards in a grid layout
 */
export function TaskListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * EmptyState - Component for displaying when no tasks are available
 */
export function EmptyState({
  title = 'No tasks available',
  description = 'Tasks will appear here once they are created',
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 py-12 px-4 text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>

      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 mb-4">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ErrorState - Component for displaying error messages
 */
export function ErrorState({
  title = 'Failed to load tasks',
  message = 'An error occurred while fetching tasks',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start">
        <svg
          className="h-6 w-6 text-red-600 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-900">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
