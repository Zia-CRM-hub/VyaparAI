"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

export function TenantStatusButton({ tenantId, status }: { tenantId: string; status: "ACTIVE" | "SUSPENDED" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const next = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  return (
    <div className="grid gap-1">
      <Button
        variant={status === "ACTIVE" ? "outline" : "primary"}
        disabled={busy}
        onClick={async () => {
          if (next === "SUSPENDED" && !confirm("Suspend this business? Its users will be signed out of the app immediately.")) return;
          setBusy(true); setErr(null);
          try { await api(`/api/admin/tenants/${tenantId}/status`, { method: "PATCH", body: { status: next } }); router.refresh(); }
          catch (e) { setErr((e as Error).message); }
          setBusy(false);
        }}
      >
        {status === "ACTIVE" ? "Suspend business" : "Reactivate business"}
      </Button>
      {err && <p role="alert" className="text-xs text-red-700">{err}</p>}
    </div>
  );
}
