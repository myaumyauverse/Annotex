"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useTasks } from "@/hooks/use-tasks";

export default function TasksPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");

  const { tasks, loading, error, refetch } = useTasks(statusFilter ? { status: statusFilter, limit: 100 } : { limit: 100 });

  const filtered = useMemo(() => {
    if (!statusFilter) {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  const role = user?.role ?? "unknown";

  return (
    <section className="space-y-6">
      <article className="card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-xs text-muted">Task Queue</p>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em]">Tasks</h1>
            <p className="mt-2 text-sm text-muted">Browse tasks and open details for labeling progress and submissions.</p>
          </div>

          <div className="flex items-center gap-2">
            <select className="field" onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="validated">Validated</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            <button className="btn-secondary" onClick={() => void refetch()} type="button">
              Refresh
            </button>
          </div>
        </div>
      </article>

      {error ? (
        <article className="card rounded-[1.75rem] p-6 text-sm text-red-700">
          Failed to load tasks: {error.message}
        </article>
      ) : null}

      <article className="card rounded-[1.75rem] p-6">
        {loading ? <p className="text-sm text-muted">Loading tasks...</p> : null}

        {!loading && filtered.length === 0 ? <p className="text-sm text-muted">No tasks found for this filter.</p> : null}

        <div className="space-y-3">
          {filtered.map((task) => (
            <div key={task.id} className="rounded-xl border border-black/10 bg-white/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted">{task.description}</p>
                  <p className="text-xs text-muted">
                    Status: {task.status} | Reward: {task.reward} | Labels: {task.submittedLabels}/{task.requiredLabels}
                  </p>
                </div>

                <Link className="btn-primary" href={`/dashboard/tasks/${task.id}`}>
                  Open task
                </Link>
              </div>
            </div>
          ))}
        </div>
      </article>

      {role === "validator" || role === "admin" ? (
        <article className="card rounded-[1.75rem] p-6 text-sm text-muted">
          Need label review? Open <Link className="underline" href="/dashboard/review">Review Labels</Link>.
        </article>
      ) : null}
    </section>
  );
}
