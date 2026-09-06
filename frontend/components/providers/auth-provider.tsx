"use client";

import { createContext, useContext } from "react";
import { signOut, useSession } from "next-auth/react";

import type { AuthUser } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken?: string;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data, status, update } = useSession();

  const user = (data?.user as AuthUser | undefined) ?? null;
  const accessToken = data?.accessToken;
  const isLoading = status === "loading";

  const setUser = (nextUser: AuthUser | null) => {
    void update(nextUser ? { ...data, user: nextUser } : undefined);
  };

  const logout = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return <AuthContext.Provider value={{ user, accessToken, isLoading, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}