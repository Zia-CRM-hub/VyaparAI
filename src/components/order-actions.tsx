"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getTemplate, type AgeGroup, type Gender } from "@/lib/measurements";
import { nextStatuses, primaryAction, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { api } from "@/lib/client";
import { MeasurementEditor, toStrings, type MeasureValues } from "./measurement-editor";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

const Err = ({ msg }: { msg: string | null }) => (msg ? <p role="alert" className="text-sm text-red-700">{msg}</p> : null);

/** One-tap "next step" plus an overflow of the other legal moves. */
export function StatusActions({ orderId, status, canAdvance, canCancel }: { orderId: string; status: OrderStatus; canAdvance: boolean; canCancel: boolean }) {
  const { busy, error, run } = useAction();
  const [note, setNote] = useState("");
  const primary = primaryAction(status);
  const others = nextStatuses(status).filter((s) => s !== primary?.to && (s === "CANCELLED" ? canCancel : canAdvance));
  const move = (to: OrderStatus) => run(() => api(`/api/orders/${orderId}/status`, { body: { to, note: note || undefined } }).then(() => setNote("")));

  if (!primary && others.length === 0) return null;
  return (
    <div className="grid gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} className="field mt-0" placeholder="Optional note for the timeline" maxLength={300} aria-label="Status note" />
      <div className="flex flex-wrap gap-2">
        {primary && canAdvance && <Button disabled={busy} onClick={() => move(primary.to)}>{primary.label}</Button>}
        {others.map((s) => (
          <Button key={s} variant="outline" disabled={busy} onClick={() => { if (s !== "CANCELLED" || confirm("Cancel this order?")) void move(s); }}>
            {s === "CANCELLED" ? "Cancel order" : s === "ALTERATION" ? "Needs alteration" : `Move to ${STATUS_LABEL[s]}`}
          </Button>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}

export function PaymentForm({ orderId, balance }: { orderId: string; balance: string }) {
  const { busy, error, run } = useAction();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  // One key per form fill, so a double tap or retry cannot record the same payment twice.
  const [key, setKey] = useState(() => crypto.randomUUID());

  return (
    <form
      className="grid gap-2 sm:grid-cols-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(() => api(`/api/orders/${orderId}/payments`, { body: { amount, method, reference: reference || undefined, idempotencyKey: key } }));
        if (ok) { setAmount(""); setReference(""); setKey(crypto.randomUUID()); }
      }}
    >
      <label className="text-sm font-medium">Amount (₹)
        <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="field" placeholder={balance} />
      </label>
      <label className="text-sm font-medium">Method
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="field">
          {["CASH", "UPI", "CARD", "BANK"].map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">Reference (optional)
        <input value={reference} onChange={(e) => setReference(e.target.value)} className="field" placeholder="UPI ref / receipt no." maxLength={80} />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-4">
        <Button type="submit" disabled={busy || !amount}>Record payment</Button>
        <Button type="button" variant="outline" onClick={() => setAmount(balance)}>Full balance ({balance})</Button>
      </div>
      <div className="sm:col-span-4"><Err msg={error} /></div>
    </form>
  );
}

export function AssignForm({ orderId, staff, current, promised }: { orderId: string; staff: { id: string; name: string; role: string }[]; current: string | null; promised: string }) {
  const { busy, error, run } = useAction();
  const [tailor, setTailor] = useState(current ?? "");
  const [date, setDate] = useState(promised);
  return (
    <form
      className="grid gap-2 sm:grid-cols-3"
      onSubmit={(e) => { e.preventDefault(); void run(() => api(`/api/orders/${orderId}`, { method: "PATCH", body: { assignedMembershipId: tailor || null, promisedDate: date } })); }}
    >
      <label className="text-sm font-medium">Assigned tailor
        <select value={tailor} onChange={(e) => setTailor(e.target.value)} className="field">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">Promised date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
      </label>
      <div className="flex items-end"><Button type="submit" disabled={busy} variant="outline">Save</Button></div>
      <div className="sm:col-span-3"><Err msg={error} /></div>
    </form>
  );
}

/** Revise measurements while the order is still before cutting (saved as a new immutable version). */
export function MeasurementPanel(props: {
  orderId: string; garment: string; gender: Gender; ageGroup: AgeGroup;
  current: Record<string, number> | null; version: number | null; editable: boolean;
}) {
  const { busy, error, run } = useAction();
  const t = getTemplate(props.garment, props.gender, props.ageGroup);
  const [values, setValues] = useState<MeasureValues>(toStrings(props.current));
  const [notes, setNotes] = useState("");
  if (!t) return <p className="text-sm text-stone-500">No template for this garment.</p>;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-stone-600">
        {props.version ? `Using saved version v${props.version}.` : "No measurements recorded yet."}
        {props.editable ? " Editing and saving creates a new version; older versions are never overwritten." : " Locked: cutting has started."}
      </p>
      <MeasurementEditor fields={t.fields} values={values} onChange={setValues} notes={notes} onNotes={setNotes} hints={t.hints} disabled={!props.editable} />
      {props.editable && (
        <div>
          <Button disabled={busy} onClick={() => run(() => api(`/api/orders/${props.orderId}/measurement`, { body: { values, notes: notes || undefined } }))}>Save measurements</Button>
        </div>
      )}
      <Err msg={error} />
    </div>
  );
}

/** Compact one-tap advance for boards and lists. */
export function AdvanceButton({ orderId, status, blockedReason }: { orderId: string; status: OrderStatus; blockedReason?: string }) {
  const { busy, error, run } = useAction();
  const p = primaryAction(status);
  if (!p) return null;
  return (
    <div className="grid gap-1">
      <Button variant="outline" className="min-h-9 px-3 text-xs" disabled={busy || !!blockedReason} title={blockedReason}
        onClick={() => run(() => api(`/api/orders/${orderId}/status`, { body: { to: p.to } }))}>
        {p.label}
      </Button>
      {blockedReason && <span className="text-[11px] text-amber-800">{blockedReason}</span>}
      <Err msg={error} />
    </div>
  );
}
