import "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string;
    membershipId?: string;
  }
  interface User {
    membershipId?: string;
  }
}
