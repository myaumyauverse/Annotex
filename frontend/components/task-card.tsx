'use client';

import { Task } from '@/hooks/use-tasks';
import { DASHBOARD_TASK_CONFIG } from '@/lib/constants';
import { usePermissions } from '@/components/rbac/use-permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Loader2, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onAssign?: (taskId: string) => Promise<void>;
  onSubmit?: (taskId: string) => Promise<void>;
}

/**
 * TaskCard - Individual task display card with role-based actions
 */
export function TaskCard({ task, onAssign, onSubmit }: TaskCardProps) {
  const { isValidator, isContributor } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate label submission progress percentage
  const progressPercent = task.requiredLabels
    ? (task.submittedLabels / task.requiredLabels) * 100
    : 0;

  // Get status color
  const statusColor = DASHBOARD_TASK_CONFIG.STATUS_COLORS[task.status];
  const statusLabel = DASHBOARD_TASK_CONFIG.STATUS_LABELS[task.status];

  // Determine if task can be assigned
  const canAssign = (isContributor() || isValidator()) && task.status === 'pending' && !task.assignedToId;

  // Handle assign action
  const handleAssign = async () => {
    if (!onAssign) return;
    try {
      setIsLoading(true);
      await onAssign(task.id);
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{task.title}</CardTitle>
            {task.dataset && (
              <CardDescription className="text-sm">
                Dataset: {task.dataset.name}
              </CardDescription>
            )}
          </div>
          <Badge className={statusColor!}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Reward */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Reward</p>
            <p className="font-semibold">◎ {task.reward.toFixed(2)}</p>
          </div>

          {/* Created Date */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Created</p>
            <p className="font-semibold text-xs">
              {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </p>
          </div>

          {/* Required Labels */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Required</p>
            <p className="font-semibold">{task.requiredLabels} labels</p>
          </div>

          {/* Consensus Threshold */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Consensus</p>
            <p className="font-semibold">{(task.consensusThreshold * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Label Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Labels Submitted</p>
            <p className="text-sm font-semibold">
              {task.submittedLabels} / {task.requiredLabels}
            </p>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Assigned User */}
        {task.assignedTo && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Assigned to</p>
            <p className="text-sm font-medium">{task.assignedTo.name}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {/* Assign Button - For contributors/validators on pending tasks */}
          {canAssign && (
            <Button
              size="sm"
              variant="default"
              onClick={handleAssign}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign to Me'
              )}
            </Button>
          )}

          {/* View/Edit Link */}
          <Link href={`/dashboard/tasks/${task.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
