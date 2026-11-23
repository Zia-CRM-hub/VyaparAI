import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/signup"];

/** Edge-safe config (no Prisma/bcrypt imports) shared by middleware and auth.ts. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (PUBLIC_PATHS.includes(path)) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
