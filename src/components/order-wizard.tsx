"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import {
  AGE_GROUP_OPTIONS, GENDER_OPTIONS, getTemplate, garmentsFor, type AgeGroup, type Gender,
} from "@/lib/measurements";
import { RELATIONS } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { MeasurementEditor, toStrings, type MeasureValues } from "./measurement-editor";

interface Cust { id: string; name: string; phone: string }
interface Member { id: string; name: string; relation: string; gender: Gender; ageGroup: AgeGroup }
interface Latest { version: number; values: Record<string, number>; createdAt: string }
interface Staff { id: string; name: string; role: string }

const iso = (daysAhead: number) => new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);

function Step({ n, title, done, disabled, children }: { n: number; title: string; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <fieldset disabled={disabled} className={cn("rounded-xl border bg-white p-4 shadow-sm", disabled ? "border-stone-200 opacity-50" : "border-stone-200")}>
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs text-white", done ? "bg-emerald-600" : "bg-brand")}>{done ? "✓" : n}</span>
        {title}
      </legend>
      <div className="grid gap-3 pt-2">{children}</div>
    </fieldset>
  );
}

export function OrderWizard(props: { staff: Staff[]; canPay: boolean; canCreateCustomer: boolean; initialCustomer?: Cust; initialMemberId?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 1. customer
  const [customer, setCustomer] = useState<Cust | null>(props.initialCustomer ?? null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Cust[]>([]);
  const [newCust, setNewCust] = useState({ name: "", phone: "", gender: "FEMALE" as Gender, ageGroup: "ADULT" as AgeGroup });
  const [showNew, setShowNew] = useState(false);

  // 2. person
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relation: "Spouse", gender: "FEMALE" as Gender, ageGroup: "ADULT" as AgeGroup });

  // 3. garment + measurements
  const [garment, setGarment] = useState<string | null>(null);
  const [latest, setLatest] = useState<Latest | null>(null);
  const [values, setValues] = useState<MeasureValues>({});
  const [notes, setNotes] = useState("");

  // 4. order details + 5. payment
  const [promised, setPromised] = useState(iso(7));
  const [tailor, setTailor] = useState("");
  const [charges, setCharges] = useState("");
  const [description, setDescription] = useState("");
  const [advance, setAdvance] = useState("");
  const [method, setMethod] = useState("UPI");

  useEffect(() => {
    if (customer || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => api<{ data: Cust[] }>(`/api/customers?q=${encodeURIComponent(q.trim())}`).then((r) => setResults(r.data.slice(0, 6))).catch(() => setResults([])), 250);
    return () => clearTimeout(t);
  }, [q, customer]);

  useEffect(() => {
    if (!customer) { setMembers([]); setMember(null); return; }
    api<{ data: Member[] }>(`/api/customers/${customer.id}/family`).then((r) => {
      setMembers(r.data);
      const pre = r.data.find((m) => m.id === props.initialMemberId) ?? (r.data.length === 1 ? r.data[0] : null);
      setMember(pre ?? null);
    }).catch((e) => setError(e.message));
  }, [customer, props.initialMemberId]);

  useEffect(() => {
    setGarment(null);
    setLatest(null);
    setValues({});
  }, [member?.id]);

  async function pickGarment(key: string) {
    if (!member) return;
    setGarment(key);
    setValues({});
    setLatest(null);
    try {
      const r = await api<{ data: { latest: (Latest & { values: Record<string, number> }) | null } }>(`/api/family/${member.id}/measurements?garment=${key}`);
      setLatest(r.data.latest);
      setValues(toStrings(r.data.latest?.values));
    } catch (e) { setError((e as Error).message); }
  }

  async function createCustomer() {
    setError(null);
    try {
      const r = await api<{ data: Cust }>("/api/customers", { body: { name: newCust.name, phone: newCust.phone, gender: newCust.gender, ageGroup: newCust.ageGroup } });
      setCustomer(r.data); setShowNew(false);
    } catch (e) { setError((e as Error).message); }
  }

  async function addMember() {
    if (!customer) return;
    setError(null);
    try {
      const r = await api<{ data: Member }>(`/api/customers/${customer.id}/family`, { body: newMember });
      setMembers((m) => [...m, r.data]); setMember(r.data); setShowAddMember(false);
    } catch (e) { setError((e as Error).message); }
  }

  const template = member && garment ? getTemplate(garment, member.gender, member.ageGroup) : null;
  const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""));
  const hasMeasurements = Object.keys(filled).length > 0;
  const ready = !!(customer && member && garment && charges && promised);

  async function submit() {
    if (!customer || !member || !garment) return;
    setBusy(true); setError(null);
    try {
      const r = await api<{ data: { id: string } }>("/api/orders", {
        body: {
          customerId: customer.id, familyMemberId: member.id, garment,
          description: description || undefined, promisedDate: promised, charges,
          assignedMembershipId: tailor || undefined,
          advance: props.canPay && advance ? { amount: advance, method } : undefined,
          measurement: hasMeasurements ? { values: filled, notes: notes || undefined } : undefined,
        },
      });
      router.push(`/orders/${r.data.id}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  const balance = charges && advance && Number(charges) >= Number(advance) ? (Number(charges) - Number(advance)).toFixed(2) : null;

  return (
    <div className="grid gap-4 pb-24">
      <Step n={1} title="Customer" done={!!customer}>
        {customer ? (
          <div className="flex items-center justify-between gap-2">
            <p><b>{customer.name}</b> <span className="text-sm text-stone-500">{customer.phone}</span></p>
            {!props.initialCustomer && <Button type="button" variant="outline" onClick={() => { setCustomer(null); setQ(""); }}>Change</Button>}
          </div>
        ) : (
          <>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="field mt-0" placeholder="Search by name or phone" aria-label="Search customers" />
            {results.length > 0 && (
              <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
                {results.map((c) => (
                  <li key={c.id}><button type="button" onClick={() => setCustomer(c)} className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm hover:bg-brand-light"><span>{c.name}</span><span className="text-stone-500">{c.phone}</span></button></li>
                ))}
              </ul>
            )}
            {props.canCreateCustomer && (showNew ? (
              <div className="grid gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
                <input className="field mt-0" placeholder="Name" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} aria-label="New customer name" />
                <input className="field mt-0" placeholder="Mobile number" inputMode="tel" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} aria-label="New customer mobile" />
                <select className="field mt-0" value={newCust.gender} onChange={(e) => setNewCust({ ...newCust, gender: e.target.value as Gender })} aria-label="Gender">{GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
                <select className="field mt-0" value={newCust.ageGroup} onChange={(e) => setNewCust({ ...newCust, ageGroup: e.target.value as AgeGroup })} aria-label="Age group">{AGE_GROUP_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
                <div className="flex gap-2 sm:col-span-2"><Button type="button" onClick={createCustomer} disabled={!newCust.name || !newCust.phone}>Save customer</Button><Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button></div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => { setShowNew(true); setNewCust((n) => ({ ...n, name: /^\d/.test(q) ? "" : q, phone: /^\d/.test(q) ? q : "" })); }}>+ New customer</Button>
            ))}
          </>
        )}
      </Step>

      <Step n={2} title="Who is it for?" done={!!member} disabled={!customer}>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button key={m.id} type="button" onClick={() => setMember(m)} aria-pressed={member?.id === m.id} className={cn("chip", member?.id === m.id && "chip-on")}>
              {m.name} <span className="opacity-70">· {m.relation}</span>
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setShowAddMember((s) => !s)}>+ Family member</button>
        </div>
        {showAddMember && (
          <div className="grid gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
            <input className="field mt-0" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} aria-label="Family member name" />
            <select className="field mt-0" value={newMember.relation} onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })} aria-label="Relation">{RELATIONS.filter((r) => r !== "Self").map((r) => <option key={r}>{r}</option>)}</select>
            <select className="field mt-0" value={newMember.gender} onChange={(e) => setNewMember({ ...newMember, gender: e.target.value as Gender })} aria-label="Gender">{GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
            <select className="field mt-0" value={newMember.ageGroup} onChange={(e) => setNewMember({ ...newMember, ageGroup: e.target.value as AgeGroup })} aria-label="Age group">{AGE_GROUP_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
            <div className="sm:col-span-2"><Button type="button" onClick={addMember} disabled={!newMember.name}>Save family member</Button></div>
          </div>
        )}
        {member && <p className="text-xs text-stone-500">{GENDER_OPTIONS.find((g) => g.value === member.gender)?.label}, {AGE_GROUP_OPTIONS.find((g) => g.value === member.ageGroup)?.label}</p>}
      </Step>

      <Step n={3} title="Garment and measurements" done={!!garment && hasMeasurements} disabled={!member}>
        {member && (
          <div className="flex flex-wrap gap-2">
            {garmentsFor(member.gender, member.ageGroup).map((g) => (
              <button key={g.key} type="button" onClick={() => pickGarment(g.key)} aria-pressed={garment === g.key} className={cn("chip", garment === g.key && "chip-on")}>{g.label}</button>
            ))}
          </div>
        )}
        {template && (
          <>
            <p className="text-sm text-stone-600">
              {latest ? <>Loaded <b>saved measurements v{latest.version}</b> ({new Date(latest.createdAt).toLocaleDateString("en-IN")}). Change any value to save a new version.</> : <>Default <b>{template.garment.label}</b> template for this person. Enter measurements now or later.</>}
            </p>
            <MeasurementEditor fields={template.fields} values={values} onChange={setValues} notes={notes} onNotes={setNotes} hints={template.hints} />
          </>
        )}
      </Step>

      <Step n={4} title="Order details" done={!!(charges && promised)} disabled={!garment}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">Promised delivery<input type="date" min={iso(0)} value={promised} onChange={(e) => setPromised(e.target.value)} className="field" /></label>
          <label className="text-sm font-medium">Assigned tailor
            <select value={tailor} onChange={(e) => setTailor(e.target.value)} className="field"><option value="">Assign later</option>{props.staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}</select>
          </label>
          <label className="text-sm font-medium">Stitching charges (₹)<input inputMode="decimal" value={charges} onChange={(e) => setCharges(e.target.value.replace(/[^0-9.]/g, ""))} className="field" placeholder="0.00" /></label>
        </div>
        <label className="text-sm font-medium">Design notes<input value={description} onChange={(e) => setDescription(e.target.value)} className="field" maxLength={500} placeholder="Neck style, lining, embroidery..." /></label>
      </Step>

      {props.canPay && (
        <Step n={5} title="Advance payment (optional)" done={!!advance} disabled={!garment}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium">Advance (₹)<input inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value.replace(/[^0-9.]/g, ""))} className="field" placeholder="0.00" /></label>
            <label className="text-sm font-medium">Method<select value={method} onChange={(e) => setMethod(e.target.value)} className="field">{["CASH", "UPI", "CARD", "BANK"].map((m) => <option key={m}>{m}</option>)}</select></label>
            <p className="self-end pb-2 text-sm">{balance !== null ? <>Balance: <b>₹{balance}</b></> : " "}</p>
          </div>
        </Step>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-stone-200 bg-white p-3 md:static md:bottom-auto md:border-0 md:bg-transparent md:p-0">
        <Button type="button" onClick={submit} disabled={!ready || busy} className="w-full md:w-auto">{busy ? "Creating..." : "Create order"}</Button>
      </div>
    </div>
  );
}
