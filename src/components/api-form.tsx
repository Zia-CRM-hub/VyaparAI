"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | boolean;
}

const cls = "mt-1 block min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm";

/** Generic JSON form: posts to our own API, shows server validation errors, refreshes the page. */
export function ApiForm(props: {
  endpoint: string;
  fields: Field[];
  submitLabel: string;
  transform?: (v: Record<string, unknown>) => Record<string, unknown>;
  /** Runs after a successful response with the submitted body (e.g. sign in after signup). */
  onSuccess?: (body: Record<string, unknown>) => Promise<void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    const fd = new FormData(form);
    let body: Record<string, unknown> = {};
    for (const f of props.fields) {
      const v = f.type === "checkbox" ? fd.get(f.name) === "on" : String(fd.get(f.name) ?? "").trim();
      if (v !== "") body[f.name] = v;
    }
    if (props.transform) body = props.transform(body);
    const res = await fetch(props.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setBusy(false);
      const j = await res.json().catch(() => null);
      const issues = j?.error?.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ");
      setError(issues || j?.error?.message || "Request failed");
      return;
    }
    form.reset();
    if (props.onSuccess) await props.onSuccess(body);
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {props.fields.map((f) => (
        <label key={f.name} className={f.type === "checkbox" ? "flex items-center gap-2 text-sm" : "text-sm font-medium"}>
          {f.type === "checkbox" ? <input type="checkbox" name={f.name} defaultChecked={!!f.defaultValue} className="h-5 w-5" /> : null}
          {f.label}
          {f.type === "select" ? (
            <select name={f.name} required={f.required} defaultValue={String(f.defaultValue ?? "")} className={cls}>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.type === "checkbox" ? null : (
            <input name={f.name} type={f.type ?? "text"} required={f.required} className={cls} autoComplete="off" />
          )}
        </label>
      ))}
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving..." : props.submitLabel}</Button>
      </div>
    </form>
  );
}
