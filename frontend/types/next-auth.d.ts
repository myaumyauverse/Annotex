import type { DefaultSession } from "next-auth";

import type { AuthUser } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: AuthUser & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    error?: string;
  }
}
