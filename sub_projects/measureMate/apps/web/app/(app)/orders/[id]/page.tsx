'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { useToast } from '@/components/toast';
import { Alert, Badge, Button, Card, Dialog, Field, Input, Skeleton } from '@/components/ui';
import { api, errorText, post } from '@/lib/api';
import { can, useMe } from '@/lib/me';
import type { OrderDetail } from '@/lib/types';
import { formatDateTime, statusTone, titleCase } from '@/lib/utils';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const currency = me?.activeTenant?.settings?.currency ?? '';
  const qc = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const o = useQuery({ queryKey: ['order', id], queryFn: () => api<OrderDetail>(`/orders/${id}`) });
  const move = useMutation({
    mutationFn: (v: { toStatus: string; version: number; note?: string }) => post<OrderDetail>(`/orders/${id}/status`, v),
    onSuccess: (d) => { qc.setQueryData(['order', id], d); void qc.invalidateQueries({ queryKey: ['orders'] }); toast('Status updated'); setTarget(null); setNote(''); },
    onError: (e) => { toast(errorText(e), 'danger'); void qc.invalidateQueries({ queryKey: ['order', id] }); setTarget(null); },
  });

  if (o.isLoading) return <Skeleton className="h-64" />;
  if (o.isError || !o.data) return <Alert>{errorText(o.error)}</Alert>;
  const d = o.data;
  const allowed = d.allowedTransitions.filter((s) =>
    s === 'CANCELLED' ? can(me, 'order.cancel')
      : ['PARTIALLY_DELIVERED', 'DELIVERED', 'CLOSED'].includes(s) ? can(me, 'order.deliver')
        : d.status === 'DRAFT' ? can(me, 'order.update') || can(me, 'order.status') : can(me, 'order.status'));
  const needsReason = target === 'CANCELLED';

  return (
    <>
      <div className="mb-5">
        <Link href="/orders" className="text-sm text-muted-foreground hover:underline">← Orders</Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{d.orderNumber} <Badge tone={statusTone(d.status)}>{titleCase(d.status)}</Badge></h1>
        <p className="text-sm text-muted-foreground">
          <Link className="underline" href={`/customers/${d.customer.id}`}>{d.customer.fullName}</Link> ({d.customer.customerNumber})
          {d.deliveryDate && <> · due {new Date(d.deliveryDate).toLocaleDateString()}</>} · {titleCase(d.kind)} · {titleCase(d.priority)} priority
        </p>
      </div>

      {allowed.length > 0 && (
        <Card className="mb-5 p-4">
          <p className="mb-2 text-sm font-medium">Move this order to</p>
          <div className="flex flex-wrap gap-2">
            {allowed.map((s) => <Button key={s} variant={s === 'CANCELLED' ? 'danger' : 'secondary'} onClick={() => setTarget(s)}>{titleCase(s)}</Button>)}
          </div>
        </Card>
      )}

      <Card className="mb-5 divide-y divide-border">
        {d.items.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div><p className="font-medium">{i.garmentType} × {i.quantity}</p><p className="text-xs text-muted-foreground">{currency} {i.unitPrice} each{i.discount !== '0.00' ? `, discount ${i.discount}` : ''} · tax {i.taxPercent}% · {titleCase(i.stage)}</p></div>
            <p className="font-medium">{currency} {i.lineTotal}</p>
          </div>
        ))}
        <dl className="space-y-1 p-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{currency} {d.subtotal}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{currency} {d.tax}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{currency} {d.total}</dd></div>
          <div className="flex justify-between text-muted-foreground"><dt>Paid</dt><dd>{currency} {d.paidAmount} ({titleCase(d.paymentStatus)})</dd></div>
        </dl>
      </Card>
      {d.notes && <p className="mb-5 text-sm"><strong>Notes:</strong> {d.notes}</p>}

      <section aria-label="Status history">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Status history</h2>
        <ol className="space-y-2">
          {[...d.history].reverse().map((h) => (
            <li key={h.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p><strong>{titleCase(h.toStatus)}</strong>{h.fromStatus && <span className="text-muted-foreground"> from {titleCase(h.fromStatus)}</span>}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}{h.by && ` · ${h.by}`}</p>
              {h.note && <p className="mt-1">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <Dialog open={!!target} onClose={() => setTarget(null)} title={target ? `Move to ${titleCase(target)}` : ''}
        footer={<><Button variant="secondary" onClick={() => setTarget(null)}>Back</Button>
          <Button variant={needsReason ? 'danger' : 'primary'} disabled={needsReason && !note.trim()} loading={move.isPending}
            onClick={() => target && move.mutate({ toStatus: target, version: d.version, note: note.trim() || undefined })}>Confirm</Button></>}>
        <Field label={needsReason ? 'Reason (required)' : 'Note (optional)'} htmlFor="note"><Input id="note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></Field>
      </Dialog>
    </>
  );
}
