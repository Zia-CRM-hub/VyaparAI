import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// Pages only. API routes authenticate themselves and answer 401 JSON instead of redirecting.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)"],
};
