'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Alert, Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';
import { api, errorText, post } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import type { CustomerDetail, CustomerRow, Paged } from '@/lib/types';

interface Line { garmentType: string; quantity: string; unitPrice: string; discount: string; wearerId: string }
const blank = (): Line => ({ garmentType: '', quantity: '1', unitPrice: '', discount: '', wearerId: '' });
const KINDS = ['STITCHING', 'ALTERATION', 'REPAIR', 'UNIFORM', 'REPEAT'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function NewOrderPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const preset = useSearchParams().get('customerId') ?? '';
  const [customerId, setCustomerId] = React.useState(preset);
  const [search, setSearch] = React.useState('');
  const dsearch = useDebounced(search);
  const [kind, setKind] = React.useState('STITCHING');
  const [priority, setPriority] = React.useState('NORMAL');
  const [deliveryDate, setDeliveryDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [lines, setLines] = React.useState<Line[]>([blank()]);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const results = useQuery({ queryKey: ['customers', 'pick', dsearch], enabled: !customerId && dsearch.length >= 2, queryFn: () => api<Paged<CustomerRow>>(`/customers?q=${encodeURIComponent(dsearch)}&pageSize=6&status=ACTIVE`) });
  const customer = useQuery({ queryKey: ['customer', customerId], enabled: !!customerId, queryFn: () => api<CustomerDetail>(`/customers/${customerId}`) });
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!customerId) return setError('Choose a customer first.');
    setBusy(true);
    try {
      const o = await post<{ id: string }>('/orders', {
        customerId, kind, priority, notes: notes || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        items: lines.map((l) => ({
          garmentType: l.garmentType, quantity: Number(l.quantity), unitPrice: l.unitPrice, discount: l.discount || '0', wearerId: l.wearerId || undefined,
        })),
      });
      await qc.invalidateQueries({ queryKey: ['orders'] });
      router.push(`/orders/${o.id}`);
    } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="New order" description="The order starts as a draft. Confirm it when the customer agrees." />
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Customer</h2>
          {customerId ? (
            <div className="flex items-center justify-between gap-2">
              <span>{customer.data ? `${customer.data.fullName} (${customer.data.customerNumber})` : 'Loading…'}</span>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setCustomerId(''); setSearch(''); }}>Change</Button>
            </div>
          ) : (
            <>
              <Field label="Find a customer" htmlFor="cust"><Input id="cust" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, mobile or C-00012" autoComplete="off" /></Field>
              <ul className="space-y-1">
                {results.data?.data.map((c) => (
                  <li key={c.id}><button type="button" className="flex min-h-11 w-full items-center justify-between rounded-md border border-border px-3 text-left text-sm hover:bg-muted" onClick={() => setCustomerId(c.id)}><span>{c.fullName}</span><span className="text-xs text-muted-foreground">{c.customerNumber}</span></button></li>
                ))}
                {results.data && !results.data.data.length && <li className="text-sm text-muted-foreground">No matching active customer.</li>}
              </ul>
            </>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Items</h2>
          {lines.map((l, i) => (
            <fieldset key={i} className="space-y-3 rounded-md border border-border p-3">
              <legend className="px-1 text-xs text-muted-foreground">Item {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Garment" htmlFor={`g${i}`}><Input id={`g${i}`} required value={l.garmentType} onChange={(e) => set(i, { garmentType: e.target.value })} placeholder="Shirt, Suit, Blouse…" /></Field>
                <Field label="Quantity" htmlFor={`q${i}`}><Input id={`q${i}`} required type="number" min={1} inputMode="numeric" value={l.quantity} onChange={(e) => set(i, { quantity: e.target.value })} /></Field>
                <Field label="Unit price" htmlFor={`p${i}`}><Input id={`p${i}`} required inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={l.unitPrice} onChange={(e) => set(i, { unitPrice: e.target.value })} placeholder="1200.00" /></Field>
                <Field label="Discount" htmlFor={`d${i}`}><Input id={`d${i}`} inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={l.discount} onChange={(e) => set(i, { discount: e.target.value })} placeholder="0" /></Field>
              </div>
              {customer.data && customer.data.members.length > 1 && (
                <Field label="Made for" htmlFor={`w${i}`}>
                  <Select id={`w${i}`} value={l.wearerId} onChange={(e) => set(i, { wearerId: e.target.value })}>
                    <option value="">Customer / not specified</option>
                    {customer.data.members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </Select>
                </Field>
              )}
              {lines.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" aria-hidden />Remove item</Button>}
            </fieldset>
          ))}
          <Button type="button" variant="secondary" onClick={() => setLines((ls) => [...ls, blank()])}><Plus className="h-4 w-4" aria-hidden />Add item</Button>
          <p className="text-xs text-muted-foreground">Tax and totals are calculated by the server using your business tax settings.</p>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Order type" htmlFor="kind"><Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>)}</Select></Field>
            <Field label="Priority" htmlFor="prio"><Select id="prio" value={priority} onChange={(e) => setPriority(e.target.value)}>{PRIORITIES.map((k) => <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>)}</Select></Field>
            <Field label="Delivery date" htmlFor="due"><Input id="due" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></Field>
          </div>
          <Field label="Notes" htmlFor="notes"><Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} /></Field>
        </Card>
        <div className="flex gap-2"><Button type="submit" loading={busy}>Create draft order</Button><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button></div>
      </form>
    </>
  );
}
