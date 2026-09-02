'use client';

import { SubmissionResult } from '@/components/label-submission-feedback';
import { LabelSubmitForm } from '@/components/label-submit-form';
import { useAuth } from '@/components/providers/auth-provider';
import { usePermissions } from '@/components/rbac/use-permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubmitLabel, useTaskLabels } from '@/hooks/use-labels';
import type { Task } from '@/hooks/use-tasks';
import { API_BASE_URL } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function getApiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  }
}

function parseRawData(rawData: unknown): unknown {
  if (typeof rawData !== 'string') {
    return rawData;
  }

  const trimmed = rawData.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return rawData;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return rawData;
  }
}

function getRecordImagePath(rawData: unknown): string | null {
  const normalized = parseRawData(rawData);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
    return null;
  }

  const record = normalized as Record<string, unknown>;
  const candidateKeys = ['imagePath', 'image_path', 'filePath', 'file_path', 'image', 'url'];

  for (const key of candidateKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

interface TaskRecord {
  id: string;
  recordNumber: number;
  rawData: unknown;
}

function extractRecordText(rawData: unknown): string {
  const normalized = parseRawData(rawData);

  if (typeof normalized === 'string') {
    return normalized;
  }

  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
    return 'No record content available for this task yet.';
  }

  const record = normalized as Record<string, unknown>;
  const preferredKeys = ['text', 'content', 'sentence', 'review', 'message', 'description'];

  for (const key of preferredKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const firstString = Object.values(record).find((value) => typeof value === 'string' && value.trim());
  if (typeof firstString === 'string') {
    return firstString;
  }

  return JSON.stringify(record, null, 2);
}

/**
 * TaskDetailsPage - Detailed view of a single task with label submission
 */
export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const { accessToken } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const { labels, loading: labelsLoading, refetch: refetchLabels } = useTaskLabels(taskId);
  const { lastSubmittedLabel, feedback: submitFeedback, error: submitError } = useSubmitLabel();
  const { isContributor, isValidator } = usePermissions();

  const [showForm, setShowForm] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        return;
      }

      setTasksLoading(true);
      setTaskError(null);

      try {
        const session = await getSession();
        const token = session?.accessToken ?? accessToken;

        if (!token) {
          throw new Error('Missing session token. Please sign in again.');
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json()) as {
          success: boolean;
          message: string;
          data?: Task;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || 'Failed to load task');
        }

        setTask(payload.data);

        const recordsResponse = await fetch(`${API_BASE_URL}/tasks/${taskId}/records`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (recordsResponse.ok) {
          const recordsPayload = (await recordsResponse.json()) as {
            success: boolean;
            data?: { records?: TaskRecord[] };
          };

          if (recordsPayload.success) {
            setTaskRecords(recordsPayload.data?.records ?? []);
          }
        }
      } catch (error) {
        setTask(null);
        setTaskError(error instanceof Error ? error.message : 'Failed to load task');
      } finally {
        setTasksLoading(false);
      }
    };

    void fetchTask();
  }, [taskId, accessToken]);

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-lg font-semibold text-red-900">Task not found</p>
        <p className="text-sm text-red-700 mt-2">{taskError ?? "The task you're looking for doesn't exist or has been removed."}</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const progressPercent = task.requiredLabels
    ? (task.submittedLabels / task.requiredLabels) * 100
    : 0;

  const canSubmitLabel = isContributor() || isValidator();
  const isAcceptingSubmissions = task.status === 'pending' || task.status === 'in_progress';
  const activeRecord = task.record ?? taskRecords[0];
  const labelOptions = Array.isArray(task.dataset?.labelOptions)
    ? (task.dataset?.labelOptions.filter((option): option is string => typeof option === 'string'))
    : [];
  const activeRecordImagePath = getRecordImagePath(activeRecord?.rawData);
  const activeRecordImageUrl = activeRecordImagePath && !activeRecordImagePath.startsWith('http') && !activeRecordImagePath.startsWith('data:')
    ? `${getApiOrigin()}/uploads/${activeRecordImagePath.replace(/^\/+/, '')}`
    : activeRecordImagePath;

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{task.title}</h1>
        </div>
        <Badge className="text-lg px-3 py-1">
          {task.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Task Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reward */}
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Reward</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">◎ {task.reward.toFixed(2)}</p>
        </div>

        {/* Dataset */}
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Dataset</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">{task.dataset?.name || 'Unknown'}</p>
        </div>

        {/* Required Labels */}
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Required Labels</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{task.requiredLabels}</p>
        </div>

        {/* Consensus Threshold */}
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Consensus</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{(task.consensusThreshold * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="text-gray-700 leading-relaxed">{task.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t">
          <span>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
          {task.assignedTo && (
            <>
              <span>•</span>
              <span>Assigned to {task.assignedTo.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Record Content */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-xl font-semibold">Data To Label</h2>
        {activeRecord ? (
          <>
            <p className="text-xs font-medium uppercase text-gray-500">Record #{activeRecord.recordNumber}</p>
            {activeRecordImageUrl ? (
              <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                <img
                  alt={`Record ${activeRecord.recordNumber}`}
                  className="mx-auto max-h-[480px] w-full object-contain bg-white"
                  src={activeRecordImageUrl}
                />
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-gray-800">{extractRecordText(activeRecord.rawData)}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-600">No record payload found for this task.</p>
        )}
      </div>

      {/* Label Progress */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Label Progress</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {task.submittedLabels} / {task.requiredLabels} labels received
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {Math.round(progressPercent)}%
            </p>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Labels List */}
        {labelsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : labels.length > 0 ? (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm">Submitted Labels:</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {labels.map((label, idx) => (
                <div key={label.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {idx + 1}. {label.value}
                    </p>
                    <p className="text-xs text-gray-600">
                      Confidence: {Math.round(label.confidence * 100)}%
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {formatDistanceToNow(new Date(label.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 py-4">No labels submitted yet</p>
        )}
      </div>

      {/* Label Submission Form */}
      {canSubmitLabel && isAcceptingSubmissions && (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Submit Your Label</h2>
            {showForm && (
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Hide form
              </button>
            )}
          </div>

          {/* Show Result if submission was successful */}
          {lastSubmittedLabel && showResult && (
            <SubmissionResult
              labelValue={lastSubmittedLabel.value}
              confidence={lastSubmittedLabel.confidence}
              submittedAt={lastSubmittedLabel.createdAt}
              onContinue={() => {
                setShowResult(false);
                setShowForm(true);
              }}
            />
          )}

          {/* Show form or start button */}
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Labeling
            </Button>
          ) : (
            <LabelSubmitForm
              taskId={taskId}
              taskTitle={task.title}
              labelType={task.dataset?.labelType}
              labelOptions={labelOptions}
              onSuccess={() => {
                setShowForm(false);
                setShowResult(true);
                void refetchLabels();
                // Auto hide result after 5 seconds
                setTimeout(() => {
                  setShowResult(false);
                  setShowForm(true);
                }, 5000);
              }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {/* Disabled State Message */}
      {!canSubmitLabel && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-yellow-900">
            You don't have permission to submit labels for this task.
          </p>
        </div>
      )}

      {canSubmitLabel && !isAcceptingSubmissions && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-700">
            This task is no longer accepting submissions ({task.status}).
          </p>
        </div>
      )}
    </div>
  );
}
