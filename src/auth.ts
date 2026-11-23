import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { authenticate } from "./server/login";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const user = await authenticate(credentials, { ip, userAgent: request.headers.get("user-agent") });
        return user;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // The JWT only carries two opaque ids. Tenant, role and permissions are re-derived from the
    // database on every request (see server/context.ts), so they cannot be forged or go stale.
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.membershipId = (user as { membershipId?: string }).membershipId;
      }
      return token;
    },
    session({ session, token }) {
      session.userId = token.userId as string;
      session.membershipId = token.membershipId as string;
      return session;
    },
  },
});
