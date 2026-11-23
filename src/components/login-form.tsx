"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/schemas";

type Values = z.input<typeof loginSchema>;
const cls = "mt-1 block min-h-11 w-full rounded-lg border border-stone-300 px-3 text-sm";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = await signIn("credentials", { ...v, redirect: false });
    if (res?.error) setError("Invalid email or password");
    else {
      router.push("/dashboard");
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="text-sm font-medium">
        Email
        <input type="email" autoComplete="email" className={cls} {...register("email")} />
      </label>
      <label className="text-sm font-medium">
        Password
        <input type="password" autoComplete="current-password" className={cls} {...register("password")} />
      </label>
      {(error || Object.keys(formState.errors).length > 0) && (
        <p role="alert" className="text-sm text-red-700">{error ?? "Enter a valid email and password"}</p>
      )}
      <Button type="submit" disabled={formState.isSubmitting}>Sign in</Button>
    </form>
  );
}
