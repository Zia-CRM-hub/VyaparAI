import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-brand">Start your VyaparAI trial</h1>
      <Card>
        <SignupForm />
      </Card>
      <p className="text-sm">
        Already registered? <Link href="/login" className="text-brand underline">Sign in</Link>
      </p>
    </main>
  );
}
