"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out">
      <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
