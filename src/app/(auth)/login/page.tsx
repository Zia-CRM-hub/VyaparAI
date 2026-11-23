import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-brand">VyaparAI</h1>
      <Card>
        <h2 className="mb-3 font-medium">Sign in</h2>
        <LoginForm />
      </Card>
      <p className="text-sm">
        New business? <Link href="/signup" className="text-brand underline">Create an account</Link>
      </p>
    </main>
  );
}
