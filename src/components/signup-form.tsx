"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ApiForm } from "./api-form";

export function SignupForm() {
  const router = useRouter();
  return (
    <ApiForm
      endpoint="/api/signup"
      submitLabel="Create my business account"
      fields={[
        { name: "businessName", label: "Business name", required: true },
        { name: "ownerName", label: "Your name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "password", label: "Password (10+ chars, letters and numbers)", type: "password", required: true },
        { name: "city", label: "City" },
      ]}
      onSuccess={async (b) => {
        await signIn("credentials", { email: b.email, password: b.password, redirect: false });
        router.push("/dashboard");
      }}
    />
  );
}
