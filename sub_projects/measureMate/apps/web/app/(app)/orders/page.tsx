'use client';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { can, useMe } from '@/lib/me';
import type { OrderList } from '@/lib/types';
import { statusTone, titleCase } from '@/lib/utils';

const STATUSES = [
  'DRAFT', 'CONFIRMED', 'MEASUREMENT_PENDING', 'MEASUREMENT_COMPLETED', 'CUTTING', 'STITCHING', 'TRIAL_READY', 'TRIAL_COMPLETED',
  'ALTERATION', 'FINISHING', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CLOSED', 'CANCELLED',
];

export default function OrdersPage() {
  const { data: me } = useMe();
  const currency = me?.activeTenant?.settings?.currency ?? '';
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const dq = useDebounced(q);
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (dq) params.set('q', dq);
  if (status) params.set('status', status);
  const list = useQuery({ queryKey: ['orders', params.toString()], queryFn: () => api<OrderList>(`/orders?${params}`), placeholderData: (p) => p });
  const counts = list.data?.statusCounts ?? {};
  const filtered = !!(dq || status);

  return (
    <>
      <PageHeader title="Orders" description="Track every order from booking to delivery."
        actions={can(me, 'order.create') ? <Link href="/orders/new" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" aria-hidden />New order</Link> : undefined} />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" type="search" aria-label="Search orders" placeholder="Search order number or customer name…" />
      </div>
      <div role="group" aria-label="Filter by status" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Button size="sm" variant={status === '' ? 'primary' : 'secondary'} onClick={() => { setStatus(''); setPage(1); }}>All</Button>
        {STATUSES.filter((s) => counts[s] || s === status).map((s) => (
          <Button key={s} size="sm" variant={status === s ? 'primary' : 'secondary'} onClick={() => { setStatus(s); setPage(1); }}>{titleCase(s)} ({counts[s] ?? 0})</Button>
        ))}
      </div>

      {list.isLoading ? <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        : !list.data?.data.length ? (
          <Card><EmptyState icon={<ClipboardList className="h-8 w-8" />} title={filtered ? 'No orders match' : 'No orders yet'}
            body={filtered ? 'Try a different search or status.' : 'Create the first order for a customer to start tracking production.'}
            action={!filtered && can(me, 'order.create') ? <Link href="/orders/new" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">New order</Link> : undefined} /></Card>
        ) : (
          <ul className="space-y-2">
            {list.data.data.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-muted/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.orderNumber} <span className="text-sm font-normal text-muted-foreground">· {o.customer.fullName}</span></span>
                    <span className="block text-sm text-muted-foreground">{o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {currency} {o.total}{o.deliveryDate ? ` · due ${new Date(o.deliveryDate).toLocaleDateString()}` : ''}</span>
                  </span>
                  <span className="flex flex-wrap gap-1">{o.priority !== 'NORMAL' && <Badge tone={o.priority === 'URGENT' ? 'danger' : 'neutral'}>{titleCase(o.priority)}</Badge>}<Badge tone={statusTone(o.status)}>{titleCase(o.status)}</Badge></span>
                </Link>
              </li>
            ))}
          </ul>
        )}

      {list.data && list.data.meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {list.data.meta.page} of {list.data.meta.pages} · {list.data.meta.total} orders</span>
          <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page >= list.data.meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
        </div>
      )}
    </>
  );
}
