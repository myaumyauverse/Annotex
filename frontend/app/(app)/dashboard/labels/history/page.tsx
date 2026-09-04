'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLabelHistory } from '@/hooks/use-labels';
import { LabelHistory } from '@/components/label-history';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * LabelHistoryPage - Shows user's label submission history and performance metrics
 */
export default function LabelHistoryPage() {
  const router = useRouter();
  const { labels, loading, error, refetch } = useLabelHistory();

  const historyItems = labels.map((label) => ({
    id: label.id,
    taskId: label.taskId,
    taskTitle: label.task?.title ?? `Task ${label.taskId.slice(0, 8)}`,
    value: label.value,
    confidence: label.confidence,
    createdAt: label.createdAt,
  }));

  const handleTaskClick = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Label History</h1>
            <p className="text-gray-600 mt-1">Track your submissions and performance</p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-900">Failed to load history</p>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <Button onClick={() => void refetch()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {!error && (
        <LabelHistory
          labels={historyItems}
          loading={loading}
          onTaskClick={handleTaskClick}
        />
      )}
    </div>
  );
}
