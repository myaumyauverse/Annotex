"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminOnly, ContributorOnly, ValidatorOnly } from "@/components/rbac";
import { usePermissions } from "@/components/rbac/use-permissions";
import { API_BASE_URL } from "@/lib/constants";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  reward: number;
  requiredLabels: number;
  submittedLabels: number;
};

type Transaction = {
  id: string;
  amount: number;
  status: string;
  transactionHash?: string | null;
  createdAt: string;
};

type UserPerformance = {
  statistics?: {
    totalLabels: number;
    acceptedLabels: number;
    accuracyRate: string;
    averageTimePerLabel: number;
    totalEarnings: number;
  };
};

type PendingPayoutSummary = {
  totalPendingSOL: number;
  totalPendingCount: number;
};

type DatasetSummary = {
  id: string;
  name: string;
  format: string;
  totalRecords: number;
  createdAt: string;
  createdBy?: {
    firstName?: string;
    lastName?: string;
  };
};

type PaymentRequest = {
  transactionId: string;
  paymentUrl: string;
  qrCode: string;
  reference: string;
  recipient: string;
  amountSOL: number;
  payoutCount?: number;
  network: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export default function DashboardPage() {
  const { user, accessToken, isLoading } = useAuth();
  const permissions = usePermissions();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [labelValue, setLabelValue] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>(user?.walletAddress ?? "");
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDescription, setNewTaskDescription] = useState<string>("");
  const [newTaskReward, setNewTaskReward] = useState<string>("");
  const [fundingDatasetId, setFundingDatasetId] = useState<string>("");
  const [fundingAmount, setFundingAmount] = useState<string>("0.1");
  const [payoutUserId, setPayoutUserId] = useState<string>("");
  const [latestPaymentRequest, setLatestPaymentRequest] = useState<PaymentRequest | null>(null);
  const [pendingPayoutSummary, setPendingPayoutSummary] = useState<PendingPayoutSummary | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);

  const canCallApi = Boolean(accessToken);

  const activeTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId), [tasks, selectedTaskId]);

  const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    if (!accessToken) {
      throw new Error("Missing session token. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || !payload.success || payload.data === undefined) {
      throw new Error(payload.message || "Request failed");
    }

    return payload.data;
  };

  const requestVoid = async (path: string, init?: RequestInit): Promise<void> => {
    if (!accessToken) {
      throw new Error("Missing session token. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json()) as ApiEnvelope<unknown>;

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Request failed");
    }
  };

  const withFeedback = async (action: () => Promise<void>, successText: string) => {
    setIsBusy(true);
    setFeedback("");

    try {
      await action();
      setFeedback(successText);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setIsBusy(false);
    }
  };

  const fetchTasks = async () => {
    await withFeedback(async () => {
      const data = await request<{ tasks: Task[] }>("/tasks?limit=25");
      setTasks(data.tasks ?? []);

      if (!selectedTaskId && data.tasks?.length) {
        setSelectedTaskId(data.tasks[0].id);
      }
    }, "Tasks refreshed from backend.");
  };

  const assignTask = async (taskId: string) => {
    await withFeedback(async () => {
      await request(`/tasks/${taskId}/assign`, { method: "POST" });
      await fetchTasks();
    }, "Task assigned successfully.");
  };

  const submitLabel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTaskId || !labelValue.trim()) {
      setFeedback("Select a task and enter a label value.");
      return;
    }

    await withFeedback(async () => {
      await request("/labels", {
        method: "POST",
        body: JSON.stringify({
          taskId: selectedTaskId,
          value: labelValue.trim(),
          confidence: 1,
        }),
      });
      setLabelValue("");
      await fetchTasks();
    }, "Label submitted.");
  };

  const connectWallet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!walletAddress.trim()) {
      setFeedback("Enter a wallet address.");
      return;
    }

    await withFeedback(async () => {
      await request("/blockchain/connect-wallet", {
        method: "POST",
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      });
    }, "Wallet connected.");
  };

  const fetchUserPerformance = async () => {
    await withFeedback(async () => {
      const data = await request<UserPerformance>("/analytics/user-performance");
      setPerformance(data);
    }, "Performance metrics loaded.");
  };

  const fetchTransactions = async () => {
    await withFeedback(async () => {
      const data = await request<{ transactions: Transaction[] }>("/blockchain/transactions?limit=10");
      setTransactions(data.transactions ?? []);
    }, "Transactions loaded.");
  };

  const fetchPendingPayouts = async () => {
    await withFeedback(async () => {
      const data = await request<PendingPayoutSummary>("/payouts/pending");
      setPendingPayoutSummary(data);
    }, "Pending earnings loaded.");
  };

  const fetchDatasets = async () => {
    await withFeedback(async () => {
      const data = await request<{ datasets: DatasetSummary[] }>("/datasets?limit=25");
      setDatasets(data.datasets ?? []);
    }, "Datasets loaded.");
  };

  const deleteDataset = async (dataset: DatasetSummary) => {
    const confirmed = window.confirm(`Delete dataset \"${dataset.name}\"? This will remove its records, tasks, and labels.`);
    if (!confirmed) {
      return;
    }

    await withFeedback(async () => {
      await requestVoid(`/datasets/${dataset.id}`, { method: "DELETE" });
      await fetchDatasets();
    }, `Dataset \"${dataset.name}\" deleted.`);
  };

  const createProjectFundingRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fundingDatasetId.trim() || !fundingAmount.trim()) {
      setFeedback("Enter dataset id and funding amount.");
      return;
    }

    await withFeedback(async () => {
      const data = await request<PaymentRequest>("/blockchain/project-funding-request", {
        method: "POST",
        body: JSON.stringify({
          datasetId: fundingDatasetId.trim(),
          amountSOL: Number(fundingAmount),
          label: "Annotex Project Funding",
          message: "Fund dataset rewards on Solana devnet",
        }),
      });

      setLatestPaymentRequest(data);
    }, "Funding request generated. Scan QR in a Solana wallet on devnet.");
  };

  const confirmTransfer = async (transactionId: string) => {
    await withFeedback(async () => {
      const result = await request<{ status: string; signature?: string }>("/blockchain/confirm-transfer", {
        method: "POST",
        body: JSON.stringify({ transactionId }),
      });

      if (result.status === "confirmed") {
        await fetchTransactions();
      }
    }, "Transfer confirmation check completed.");
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTaskTitle.trim() || !newTaskDescription.trim() || !newTaskReward.trim()) {
      setFeedback("Fill in all task fields.");
      return;
    }

    await withFeedback(async () => {
      await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          reward: parseFloat(newTaskReward),
        }),
      });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskReward("");
      await fetchTasks();
    }, "Task created successfully.");
  };

  const approveLabel = async (labelId: string) => {
    await withFeedback(async () => {
      await request(`/labels/${labelId}/approve`, { method: "POST" });
      setFeedback("Label approved.");
    }, "Label approved.");
  };

  const rejectLabel = async (labelId: string) => {
    await withFeedback(async () => {
      await request(`/labels/${labelId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Did not meet quality standards" }),
      });
      setFeedback("Label rejected.");
    }, "Label rejected.");
  };

  const triggerPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!payoutUserId.trim()) {
      setFeedback("Enter a contributor user id for payout.");
      return;
    }

    await withFeedback(async () => {
      const data = await request<PaymentRequest>("/payouts/trigger", {
        method: "POST",
        body: JSON.stringify({ userId: payoutUserId.trim() }),
      });

      setLatestPaymentRequest(data);
    }, "Payout request generated. Use admin wallet on devnet to complete payment.");
  };

  return (
    <section className="space-y-8">
      {/* Welcome Section */}
      <div className="card rounded-4xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="eyebrow text-sm text-muted">
              {permissions.isAdmin() ? "Admin Dashboard" : permissions.isValidator() ? "Validator Hub" : "Contributor Workspace"}
            </p>
            <h1 className="font-mono text-3xl font-semibold tracking-[-0.05em] md:text-5xl">
              {isLoading ? "Loading workspace..." : `Welcome, ${user?.firstName ?? "User"}`}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted md:text-base">
              {permissions.isAdmin() && "Manage tasks, review labels, approve quality work, and process contributor payouts."}
              {permissions.isValidator() && "Review submitted labels, approve quality work, and monitor platform metrics."}
              {permissions.isContributor() &&
                "Browse available labeling tasks, submit your annotations, track your accuracy, and manage wallet for payouts."}
            </p>
          </div>
          <div className="rounded-3xl border border-black/8 bg-white/60 px-4 py-3 text-sm text-muted">
            <div>Role</div>
            <div className="mt-1 font-mono text-lg font-semibold text-foreground">{user?.role ?? "unknown"}</div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard */}
      <AdminOnly role={user?.role}>
        <div className="space-y-5">
          {/* Admin Action Buttons */}
          <div className="grid gap-4 md:grid-cols-4">
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchTasks} type="button">
              Fetch all tasks
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchUserPerformance} type="button">
              View statistics
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchTransactions} type="button">
              View transactions
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchDatasets} type="button">
              Manage datasets
            </button>
          </div>

          {feedback ? <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm">{feedback}</div> : null}

          {/* Task Management Section */}
          <div className="grid gap-5 lg:grid-cols-[1.5fr_0.85fr]">
            {/* Create New Task */}
            <article className="card rounded-[1.75rem] p-6">
              <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Create new task</h2>
              <p className="mt-2 text-sm text-muted">Set up a new data labeling task for contributors.</p>

              <form className="mt-4 space-y-3" onSubmit={createTask}>
                <input
                  className="field"
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Task title (e.g., 'Classify sentiment in tweets')"
                  value={newTaskTitle}
                />
                <textarea
                  className="field min-h-20"
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                  placeholder="Task description and instructions"
                  value={newTaskDescription}
                />
                <input
                  className="field"
                  onChange={(event) => setNewTaskReward(event.target.value)}
                  placeholder="Reward amount (e.g., 0.5)"
                  type="number"
                  step="0.01"
                  value={newTaskReward}
                />
                <button className="btn-primary w-full" disabled={!canCallApi || isBusy} type="submit">
                  Create Task
                </button>
              </form>
            </article>

            {/* Task List Overview */}
            <article className="card rounded-[1.75rem] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Tasks</h2>
                <span className="text-sm text-muted">{tasks.length}</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="rounded-lg border border-black/10 bg-white/50 p-3 text-sm">
                    <p className="font-semibold truncate">{task.title}</p>
                    <p className="text-xs text-muted">
                      Status: {task.status} | Reward: {task.reward} | {task.submittedLabels}/{task.requiredLabels} labels
                    </p>
                  </div>
                ))}
                {!tasks.length ? <p className="text-sm text-muted">No tasks yet.</p> : null}
              </div>
            </article>
          </div>

          {/* Label Review Section */}
          <article className="card rounded-[1.75rem] p-6">
            <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Label review queue</h2>
            <p className="mt-2 text-sm text-muted">Approve or reject submitted labels from contributors.</p>
            <div className="mt-4 rounded-lg border border-black/10 bg-white/50 p-4 text-sm text-muted">
              <p>Label review functionality: API integration pending</p>
              <p className="mt-2">Buttons for approve/reject will appear once backend endpoints are ready.</p>
            </div>
          </article>

          {/* Dataset Management */}
          <article className="card rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Dataset management</h2>
                <p className="mt-2 text-sm text-muted">Delete mistaken uploads from here (admin only).</p>
              </div>
              <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchDatasets} type="button">
                Refresh datasets
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="rounded-lg border border-black/10 bg-white/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{dataset.name}</p>
                      <p className="mt-1 break-all text-xs text-muted">ID: {dataset.id}</p>
                      <p className="mt-1 text-xs text-muted">
                        {dataset.totalRecords} records | format: {dataset.format} | by {dataset.createdBy?.firstName ?? "Unknown"} {dataset.createdBy?.lastName ?? ""}
                      </p>
                    </div>
                    <button
                      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canCallApi || isBusy}
                      onClick={() => deleteDataset(dataset)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!datasets.length ? <p className="text-sm text-muted">No datasets loaded yet. Click Refresh datasets.</p> : null}
            </div>
          </article>

          {/* Payout Management */}
          <article className="card rounded-[1.75rem] p-6">
            <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Payout management</h2>
            <p className="mt-2 text-sm text-muted">Create Solana Pay requests on devnet for project funding and contributor payouts.</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <form className="space-y-3 rounded-xl border border-black/10 bg-white/60 p-4" onSubmit={createProjectFundingRequest}>
                <h3 className="font-semibold">1. Fund project wallet</h3>
                <input
                  className="field"
                  onChange={(event) => setFundingDatasetId(event.target.value)}
                  placeholder="Dataset ID"
                  value={fundingDatasetId}
                />
                <input
                  className="field"
                  min="0.000001"
                  onChange={(event) => setFundingAmount(event.target.value)}
                  placeholder="Amount in SOL"
                  step="0.000001"
                  type="number"
                  value={fundingAmount}
                />
                <button className="btn-secondary w-full" disabled={!canCallApi || isBusy} type="submit">
                  Generate funding QR
                </button>
              </form>

              <form className="space-y-3 rounded-xl border border-black/10 bg-white/60 p-4" onSubmit={triggerPayout}>
                <h3 className="font-semibold">2. Pay contributor earnings</h3>
                <input
                  className="field"
                  onChange={(event) => setPayoutUserId(event.target.value)}
                  placeholder="Contributor user ID"
                  value={payoutUserId}
                />
                <button className="btn-primary w-full" disabled={!canCallApi || isBusy} type="submit">
                  Generate payout QR
                </button>
              </form>
            </div>

            {latestPaymentRequest ? (
              <div className="mt-4 rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
                <p className="font-semibold">Latest request ({latestPaymentRequest.network})</p>
                <p className="mt-1 text-muted">Recipient: {latestPaymentRequest.recipient}</p>
                <p className="text-muted">Amount: {latestPaymentRequest.amountSOL} SOL</p>
                <p className="text-muted">Reference: {latestPaymentRequest.reference}</p>
                <a className="mt-2 block break-all text-xs underline" href={latestPaymentRequest.paymentUrl}>
                  {latestPaymentRequest.paymentUrl}
                </a>
                <img alt="Solana payment QR" className="mt-3 h-44 w-44 rounded-lg border border-black/10" src={latestPaymentRequest.qrCode} />
                <button
                  className="btn-secondary mt-3"
                  disabled={!canCallApi || isBusy}
                  onClick={() => confirmTransfer(latestPaymentRequest.transactionId)}
                  type="button"
                >
                  Confirm on-chain payment
                </button>
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-black/10 bg-white/50 p-4 text-sm text-muted">
              <p>Use a Solana wallet set to devnet and scan the QR to complete transfers.</p>
            </div>
          </article>
        </div>
      </AdminOnly>

      {/* Validator Dashboard */}
      <ValidatorOnly role={user?.role}>
        <div className="space-y-5">
          {/* Validator Action Buttons */}
          <div className="grid gap-4 md:grid-cols-2">
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchTasks} type="button">
              Load labels to review
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchUserPerformance} type="button">
              View metrics
            </button>
          </div>

          {feedback ? <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm">{feedback}</div> : null}

          {/* Label Review Queue */}
          <article className="card rounded-[1.75rem] p-6">
            <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Labels pending review</h2>
            <p className="mt-2 text-sm text-muted">Review submitted labels and approve quality work from contributors.</p>

            <div className="mt-4 space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-black/10 bg-white/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{task.title}</p>
                        <p className="mt-1 text-sm text-muted">{task.description}</p>
                        <p className="mt-2 text-xs text-muted">
                          Labels: {task.submittedLabels}/{task.requiredLabels} | Reward: {task.reward}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          className="btn-primary px-3 py-1 text-sm"
                          disabled={!canCallApi || isBusy}
                          onClick={() => approveLabel(task.id)}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="btn-secondary px-3 py-1 text-sm"
                          disabled={!canCallApi || isBusy}
                          onClick={() => rejectLabel(task.id)}
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No labels pending review. Load labels to see items.</p>
              )}
            </div>
          </article>

          {/* Quality Metrics */}
          <article className="card rounded-[1.75rem] p-6">
            <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Quality metrics</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Labels reviewed</dt>
                <dd>{performance?.statistics?.totalLabels ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Approved</dt>
                <dd>{performance?.statistics?.acceptedLabels ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Overall accuracy</dt>
                <dd>{performance?.statistics?.accuracyRate ? `${performance.statistics.accuracyRate}%` : "-"}</dd>
              </div>
            </dl>
          </article>
        </div>
      </ValidatorOnly>

      {/* Contributor Dashboard */}
      <ContributorOnly role={user?.role}>
        <div className="space-y-5">
          {/* Contributor Action Buttons */}
          <div className="grid gap-4 md:grid-cols-4">
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchTasks} type="button">
              Refresh tasks
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchUserPerformance} type="button">
              Load performance
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchPendingPayouts} type="button">
              Pending earnings
            </button>
            <button className="btn-secondary" disabled={!canCallApi || isBusy} onClick={fetchTransactions} type="button">
              Load transactions
            </button>
          </div>

          {feedback ? <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm">{feedback}</div> : null}

          {/* Main Contributor Interface */}
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Task Queue */}
            <article className="card rounded-[1.75rem] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Available tasks</h2>
                <span className="text-sm text-muted">{tasks.length} available</span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{task.title}</p>
                        <p className="mt-1 text-sm text-muted">{task.description}</p>
                        <p className="mt-2 text-xs text-muted">
                          Reward: <span className="font-semibold text-foreground">{task.reward}</span> | Labels needed:{" "}
                          {task.submittedLabels}/{task.requiredLabels}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          className="btn-secondary whitespace-nowrap"
                          disabled={!canCallApi || isBusy}
                          onClick={() => {
                            setSelectedTaskId(task.id);
                          }}
                          type="button"
                        >
                          Select
                        </button>
                        <button
                          className="btn-primary whitespace-nowrap"
                          disabled={!canCallApi || isBusy}
                          onClick={() => assignTask(task.id)}
                          type="button"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!tasks.length ? <p className="text-sm text-muted">No tasks available. Check back soon!</p> : null}
              </div>
            </article>

            {/* Submit Label + Wallet */}
            <article className="card rounded-[1.75rem] p-6">
              <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Submit label</h2>
              <p className="mt-2 text-sm text-muted">Selected: {activeTask?.title ?? "none"}</p>

              <form className="mt-4 space-y-3" onSubmit={submitLabel}>
                <textarea
                  className="field min-h-28"
                  onChange={(event) => setLabelValue(event.target.value)}
                  placeholder="Enter your label value"
                  value={labelValue}
                />
                <button className="btn-primary w-full" disabled={!canCallApi || isBusy} type="submit">
                  Submit label
                </button>
              </form>

              <hr className="my-6 border-black/10" />

              <h3 className="font-semibold">Wallet address</h3>
              <form className="mt-3 space-y-3" onSubmit={connectWallet}>
                <input
                  className="field"
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="Solana wallet address (base58)"
                  value={walletAddress}
                />
                <button className="btn-secondary w-full" disabled={!canCallApi || isBusy} type="submit">
                  Save address
                </button>
              </form>
            </article>
          </div>

          {/* Performance & Earnings */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Performance Stats */}
            <article className="card rounded-[1.75rem] p-6">
              <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Performance</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Total labels</dt>
                  <dd className="font-semibold">{performance?.statistics?.totalLabels ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Accepted</dt>
                  <dd className="font-semibold">{performance?.statistics?.acceptedLabels ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Accuracy rate</dt>
                  <dd className="font-semibold">
                    {performance?.statistics?.accuracyRate ? `${performance.statistics.accuracyRate}%` : "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Avg time/label</dt>
                  <dd className="font-semibold">{performance?.statistics?.averageTimePerLabel ?? "-"}s</dd>
                </div>
              </dl>
            </article>

            {/* Earnings & Transactions */}
            <article className="card rounded-[1.75rem] p-6">
              <h2 className="font-mono text-2xl font-semibold tracking-[-0.04em]">Earnings</h2>
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-2xl font-bold text-foreground">{performance?.statistics?.totalEarnings ?? "0"} SOL</p>
                <p className="mt-1 text-sm text-muted">Total earnings available</p>
                <p className="mt-2 text-xs text-muted">
                  Pending payout: {pendingPayoutSummary?.totalPendingSOL ?? 0} SOL ({pendingPayoutSummary?.totalPendingCount ?? 0} records)
                </p>
              </div>

              <h3 className="mt-6 font-semibold text-sm">Recent transactions</h3>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg border border-black/10 bg-white/50 p-2 text-xs">
                    <p className="font-semibold">{transaction.status}</p>
                    <p className="text-muted">{transaction.amount} SOL</p>
                    <p className="text-muted">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {!transactions.length ? <p className="text-sm text-muted">No transactions yet.</p> : null}
              </div>
            </article>
          </div>
        </div>
      </ContributorOnly>
    </section>
  );
}
