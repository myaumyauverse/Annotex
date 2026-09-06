'use client';

import { useMemo, useCallback, useRef } from 'react';
import { Task } from '@/hooks/use-tasks';

/**
 * useTaskCache - Provides caching and memoization for task operations
 * Prevents unnecessary re-renders and API calls
 */
export function useTaskCache(tasks: Task[]) {
  const cacheRef = useRef<Map<string, Task>>(new Map());

  // Build task map for O(1) lookups
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  // Get task by ID with caching
  const getTask = useCallback(
    (id: string) => {
      if (cacheRef.current.has(id)) {
        return cacheRef.current.get(id)!;
      }

      const task = taskMap.get(id);
      if (task) {
        cacheRef.current.set(id, task);
      }

      return task;
    },
    [taskMap]
  );

  // Filter tasks with memoization
  const filterTasks = useCallback(
    (predicate: (task: Task) => boolean) => {
      return tasks.filter(predicate);
    },
    [tasks]
  );

  // Sort tasks with memoization
  const sortTasks = useCallback(
    (sortFn: (a: Task, b: Task) => number) => {
      return [...tasks].sort(sortFn);
    },
    [tasks]
  );

  return {
    taskMap,
    getTask,
    filterTasks,
    sortTasks,
  };
}

/**
 * useDebouncedValue - Debounces a value to prevent excessive updates
 * Useful for search/filter inputs
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useIntersectionObserver - Lazy load items when they become visible
 * Improves performance for long lists
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

/**
 * Sorting functions for tasks
 */
export const TaskSorters = {
  byCreatedDate: (a: Task, b: Task) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),

  byUpdatedDate: (a: Task, b: Task) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),

  byReward: (a: Task, b: Task) => b.reward - a.reward,

  byLabelsNeeded: (a: Task, b: Task) =>
    b.requiredLabels - a.requiredLabels,

  byProgress: (a: Task, b: Task) => {
    const aProgress = a.requiredLabels ? a.submittedLabels / a.requiredLabels : 0;
    const bProgress = b.requiredLabels ? b.submittedLabels / b.requiredLabels : 0;
    return bProgress - aProgress;
  },
} as const;

/**
 * Filtering functions for tasks
 */
export const TaskFilters = {
  byStatus: (status: string) => (task: Task) => task.status === status,

  byIsAssigned: (task: Task) => !!task.assignedToId,

  byIsUnassigned: (task: Task) => !task.assignedToId,

  byMinReward: (minReward: number) => (task: Task) =>
    task.reward >= minReward,

  byRecentlyCreated: (daysAgo: number) => (task: Task) => {
    const created = new Date(task.createdAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    return created >= cutoff;
  },

  bySearchTerm: (term: string) => (task: Task) => {
    const lowerTerm = term.toLowerCase();
    return (
      task.title.toLowerCase().includes(lowerTerm) ||
      task.description.toLowerCase().includes(lowerTerm)
    );
  },
} as const;

// Import React for hooks
import React from 'react';
