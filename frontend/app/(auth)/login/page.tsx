import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { authOptions } from "@/lib/auth-options";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="card w-full max-w-xl rounded-4xl p-8 md:p-10">
      <div className="mb-8 space-y-3">
        <p className="eyebrow text-sm text-muted">Sign in</p>
        <h2 className="font-mono text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
          Welcome back to the queue.
        </h2>
        <p className="text-sm leading-6 text-muted md:text-base">
          Use your Annotex account to access task boards, review progress, and manage submissions.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-muted">
        Need an account? <Link className="font-semibold text-brand-deep" href="/register">Create one</Link>
      </p>
    </div>
  );
}