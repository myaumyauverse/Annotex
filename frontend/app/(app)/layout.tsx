import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { authOptions } from "@/lib/auth-options";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}