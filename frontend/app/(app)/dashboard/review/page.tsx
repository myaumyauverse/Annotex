"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { API_BASE_URL } from "@/lib/constants";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedLabels: number;
  requiredLabels: number;
};

type Label = {
  id: string;
  value: string;
  confidence: number;
  createdAt: string;
  contributor?: { id: string; firstName?: string; lastName?: string; email?: string };
  isAccepted: boolean;
  isRejected: boolean;
};

export default function ReviewPage() {
  const { user, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labelsByTask, setLabelsByTask] = useState<Record<string, Label[]>>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const canReview = user?.role === "validator" || user?.role === "admin";

  const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const session = await getSession();
    const token = session?.accessToken ?? accessToken;

    if (!token) {
      throw new Error("Missing session token. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json()) as {
      success: boolean;
      message: string;
      data?: T;
    };

    if (!response.ok || !payload.success || payload.data === undefined) {
      throw new Error(payload.message || "Request failed");
    }

    return payload.data;
  };

  const loadReviewQueue = async () => {
    if (!canReview) {
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const tasksPayload = await request<{ tasks: Task[]; pagination: { total: number } }>("/tasks?limit=100");
      const reviewableTasks = tasksPayload.tasks.filter(
        (task) => task.submittedLabels > 0 && task.status !== "rejected"
      );
      setTasks(reviewableTasks);

      const nextLabelsByTask: Record<string, Label[]> = {};
      await Promise.all(
        reviewableTasks.map(async (task) => {
          const labels = await request<Label[]>(`/labels/task/${task.id}`);
          nextLabelsByTask[task.id] = labels.filter((label) => !label.isAccepted && !label.isRejected);
        })
      );
      setLabelsByTask(nextLabelsByTask);
      setFeedback("Review queue loaded.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load review queue");
      setTasks([]);
      setLabelsByTask({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviewQueue();
  }, []);

  const pendingCount = useMemo(
    () => Object.values(labelsByTask).reduce((sum, labels) => sum + labels.length, 0),
    [labelsByTask]
  );

  const moderate = async (labelId: string, action: "approve" | "reject") => {
    setLoading(true);
    setFeedback("");
    try {
      await request(`/labels/${labelId}/${action}`, {
        method: "POST",
        body: action === "reject" ? JSON.stringify({ reason: "Did not meet quality standards" }) : JSON.stringify({}),
      });
      await loadReviewQueue();
      setFeedback(`Label ${action}d successfully.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : `Failed to ${action} label`);
    } finally {
      setLoading(false);
    }
  };

  if (!canReview) {
    return (
      <article className="card rounded-[1.75rem] p-6 text-sm text-red-700">
        This page is only available for validators and admins.
      </article>
    );
  }

  return (
    <section className="space-y-6">
      <article className="card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-xs text-muted">Quality Control</p>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em]">Review Labels</h1>
            <p className="mt-2 text-sm text-muted">Pending labels: {pendingCount}</p>
          </div>
          <button className="btn-secondary" disabled={loading} onClick={() => void loadReviewQueue()} type="button">
            Refresh queue
          </button>
        </div>
      </article>

      {feedback ? <article className="card rounded-[1.75rem] p-4 text-sm">{feedback}</article> : null}

      {tasks.length === 0 ? (
        <article className="card rounded-[1.75rem] p-6 text-sm text-muted">No labels pending review right now.</article>
      ) : (
        tasks.map((task) => (
          <article key={task.id} className="card rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{task.title}</h2>
                <p className="mt-1 text-sm text-muted">{task.description}</p>
                <p className="mt-1 text-xs text-muted">
                  Task labels: {task.submittedLabels}/{task.requiredLabels}
                </p>
              </div>
              <Link className="btn-secondary" href={`/dashboard/tasks/${task.id}`}>
                Open task
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(labelsByTask[task.id] ?? []).map((label) => (
                <div key={label.id} className="rounded-xl border border-black/10 bg-white/60 p-4">
                  <p className="font-medium">{label.value}</p>
                  <p className="mt-1 text-xs text-muted">
                    Confidence: {Math.round((label.confidence ?? 1) * 100)}% | Contributor: {label.contributor?.email ?? label.contributor?.id ?? "unknown"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary" disabled={loading} onClick={() => void moderate(label.id, "approve")} type="button">
                      Approve
                    </button>
                    <button className="btn-secondary" disabled={loading} onClick={() => void moderate(label.id, "reject")} type="button">
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {(labelsByTask[task.id] ?? []).length === 0 ? (
                <p className="text-sm text-muted">No pending labels on this task.</p>
              ) : null}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
