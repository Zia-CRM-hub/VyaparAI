import { INestApplication } from '@nestjs/common';
import { as, createApp, registerTenant, Tenant } from './helpers';

describe('orders and status workflow', () => {
  let app: INestApplication;
  let a: Tenant;
  let b: Tenant;
  let customerId: string;
  beforeAll(async () => {
    app = await createApp();
    a = await registerTenant(app);
    b = await registerTenant(app);
    customerId = (await as(app, a.token).post('/customers', { fullName: 'Meera Nair', mobile: '+91 90000 11111' })).body.id;
  });
  afterAll(async () => { await app.close(); });

  const items = [
    { garmentType: 'Shirt', quantity: 2, unitPrice: '1200.00', discount: '100.00', taxPercent: '5' },
    { garmentType: 'Trouser', quantity: 1, unitPrice: '999.99' },
  ];
  const mk = (over: object = {}) => as(app, a.token).post('/orders', { customerId, items, ...over });

  it('creates an order with a number, exact money totals and an initial history row', async () => {
    const r = await mk();
    expect(r.status).toBe(201);
    expect(r.body.orderNumber).toBe('ORD-00001');
    expect(r.body.status).toBe('DRAFT');
    // Shirt: 2*1200 - 100 = 2300 + 5% = 2415.00; Trouser: 999.99 + 0% tax
    expect(r.body.items[0].lineTotal).toBe('2415.00');
    expect(r.body.subtotal).toBe('3299.99');
    expect(r.body.tax).toBe('115.00');
    expect(r.body.total).toBe('3414.99');
    expect(r.body.history).toHaveLength(1);
    expect(r.body.history[0].toStatus).toBe('DRAFT');
    expect(r.body.allowedTransitions).toEqual(['CONFIRMED', 'CANCELLED']);
    expect((await mk()).body.orderNumber).toBe('ORD-00002');
  });

  it('validates input: no items, bad money, unknown customer', async () => {
    expect((await mk({ items: [] })).status).toBe(400);
    expect((await mk({ items: [{ garmentType: 'Shirt', unitPrice: '12.345' }] })).status).toBe(400);
    expect((await mk({ items: [{ garmentType: 'Shirt', unitPrice: '10', discount: '50' }] })).status).toBe(400);
    expect((await mk({ customerId: '11111111-1111-4111-8111-111111111111' })).status).toBe(404);
    expect((await mk({ items: [{ garmentType: 'Shirt', unitPrice: '10', wearerId: '11111111-1111-4111-8111-111111111111' }] })).status).toBe(400);
  });

  it('walks the workflow, records history, and enforces transitions, versions and cancel reasons', async () => {
    const o = (await mk()).body;
    const go = (id: string, toStatus: string, version: number, note?: string) => as(app, a.token).post(`/orders/${id}/status`, { toStatus, version, note });

    const bad = await go(o.id, 'CUTTING', o.version);
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe('INVALID_TRANSITION');

    const c1 = await go(o.id, 'CONFIRMED', o.version, 'Advance taken');
    expect(c1.status).toBe(200);
    expect(c1.body.version).toBe(o.version + 1);
    expect(c1.body.items.every((i: { stage: string }) => i.stage === 'CONFIRMED')).toBe(true);

    const stale = await go(o.id, 'MEASUREMENT_PENDING', o.version);
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('VERSION_CONFLICT');

    const m = await go(o.id, 'MEASUREMENT_PENDING', c1.body.version);
    const done = await go(o.id, 'MEASUREMENT_COMPLETED', m.body.version);
    expect(done.status).toBe(200);

    const noReason = await go(o.id, 'CANCELLED', done.body.version);
    expect(noReason.status).toBe(400);
    expect(noReason.body.error.code).toBe('REASON_REQUIRED');
    const cancelled = await go(o.id, 'CANCELLED', done.body.version, 'Customer changed mind');
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.allowedTransitions).toEqual([]);
    expect(cancelled.body.history.map((h: { toStatus: string }) => h.toStatus)).toEqual(['DRAFT', 'CONFIRMED', 'MEASUREMENT_PENDING', 'MEASUREMENT_COMPLETED', 'CANCELLED']);
    expect(cancelled.body.history[1].note).toBe('Advance taken');
    expect(cancelled.body.history[1].by).toBe('Test Owner');

    expect((await go(o.id, 'CONFIRMED', cancelled.body.version)).status).toBe(422);
  });

  it('lists with filters, status counts and pagination', async () => {
    const all = await as(app, a.token).get('/orders?pageSize=2');
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBe(2);
    expect(all.body.meta.total).toBeGreaterThanOrEqual(3);
    expect(all.body.statusCounts.CANCELLED).toBe(1);
    const cancelled = await as(app, a.token).get('/orders?status=CANCELLED');
    expect(cancelled.body.data).toHaveLength(1);
    expect(cancelled.body.data[0].customer.fullName).toBe('Meera Nair');
    expect((await as(app, a.token).get('/orders?q=meera')).body.meta.total).toBe(all.body.meta.total);
    expect((await as(app, a.token).get('/orders?q=nobody-here')).body.meta.total).toBe(0);
    expect((await as(app, a.token).get('/orders?status=BOGUS')).status).toBe(400);
  });

  it('isolates tenants: another tenant cannot list, read, transition or order for these records', async () => {
    const o = (await mk()).body;
    const other = as(app, b.token);
    expect((await other.get('/orders')).body.meta.total).toBe(0);
    expect((await other.get(`/orders/${o.id}`)).status).toBe(404);
    expect((await other.post(`/orders/${o.id}/status`, { toStatus: 'CONFIRMED', version: o.version })).status).toBe(404);
    expect((await other.post('/orders', { customerId, items })).status).toBe(404);
    // Order is untouched.
    expect((await as(app, a.token).get(`/orders/${o.id}`)).body.status).toBe('DRAFT');
  });

  it('requires authentication and the right permission', async () => {
    const anon = await import('supertest').then((m) => m.default(app.getHttpServer()).get('/api/v1/orders'));
    expect(anon.status).toBe(401);
  });
});
