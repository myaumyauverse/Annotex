"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";

import { useAuth } from "@/components/providers/auth-provider";
import { API_BASE_URL } from "@/lib/constants";

type PendingPayout = {
  totalPendingSOL: number;
  totalPendingCount: number;
};

type Transaction = {
  id: string;
  amount: number;
  status: string;
  transactionHash?: string | null;
  createdAt: string;
};

export default function EarningsPage() {
  const { user, accessToken } = useAuth();
  const [pending, setPending] = useState<PendingPayout | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const request = async <T,>(path: string): Promise<T> => {
    const session = await getSession();
    const token = session?.accessToken ?? accessToken;

    if (!token) {
      throw new Error("Missing session token. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json()) as { success: boolean; message: string; data?: T };
    if (!response.ok || !payload.success || payload.data === undefined) {
      throw new Error(payload.message || "Request failed");
    }

    return payload.data;
  };

  const loadData = async () => {
    if (user?.role !== "contributor") {
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      const [pendingData, txData] = await Promise.all([
        request<PendingPayout>("/payouts/pending"),
        request<{ transactions: Transaction[]; pagination: { total: number } }>("/blockchain/transactions?limit=20"),
      ]);

      setPending(pendingData);
      setTransactions(txData.transactions ?? []);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load earnings");
      setPending(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.role]);

  if (user?.role !== "contributor") {
    return <article className="card rounded-[1.75rem] p-6 text-sm text-red-700">This page is only available for contributors.</article>;
  }

  return (
    <section className="space-y-6">
      <article className="card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-xs text-muted">Contributor Finance</p>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em]">Earnings</h1>
            <p className="mt-2 text-sm text-muted">Track pending payouts and recent transactions.</p>
          </div>
          <button className="btn-secondary" disabled={loading} onClick={() => void loadData()} type="button">
            Refresh
          </button>
        </div>
      </article>

      {feedback ? <article className="card rounded-[1.75rem] p-4 text-sm">{feedback}</article> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <article className="card rounded-[1.75rem] p-6">
          <h2 className="font-semibold">Pending payout</h2>
          <p className="mt-2 text-3xl font-bold">{pending?.totalPendingSOL ?? 0} SOL</p>
          <p className="mt-1 text-sm text-muted">Across {pending?.totalPendingCount ?? 0} payout items</p>
        </article>

        <article className="card rounded-[1.75rem] p-6">
          <h2 className="font-semibold">Recent transactions</h2>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-lg border border-black/10 bg-white/60 p-3 text-sm">
                <p className="font-medium">{tx.status}</p>
                <p className="text-muted">{tx.amount} SOL</p>
                <p className="text-xs text-muted">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!transactions.length ? <p className="text-sm text-muted">No transactions yet.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
