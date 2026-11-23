import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderInput, OrderStatus, OrderTransitionInput, TRANSITIONS, canTransition, computeLine, formatMoney, parseMoney } from '@measuremate/validation';
import { AuditService } from '../../common/audit.service';
import { currentContext, currentTenantId } from '../../common/context';
import { badRequest, conflict, forbidden, notFound, unprocessable } from '../../common/errors';
import { PrismaService, Tx } from '../../common/prisma.service';
import { nextNumber } from '../../common/sequence';
import { assertBranchAccess, branchFilter, loadSettings } from '../../common/scope';

export interface OrderListParams { q?: string; status?: string; customerId?: string; page: number; pageSize: number; dir: 'asc' | 'desc' }

const money = (d: Prisma.Decimal) => d.toFixed(2);

@Injectable()
export class OrdersService {
  constructor(private readonly db: PrismaService, private readonly audit: AuditService) {}

  async create(input: OrderInput) {
    const tenantId = currentTenantId();
    const ctx = currentContext();
    return this.db.run(async (tx) => {
      const settings = await loadSettings(tx, tenantId);
      const customer = await tx.customer.findFirst({ where: { id: input.customerId, tenantId }, select: { id: true, status: true } });
      if (!customer) throw notFound('Customer');
      if (customer.status !== 'ACTIVE') throw unprocessable('CUSTOMER_NOT_ACTIVE', 'Orders can only be created for active customers');

      const branchId = await this.resolveBranch(tx, tenantId, input.branchId);
      assertBranchAccess(branchId);

      // Wearers must belong to this customer's household.
      const wearerIds = [...new Set(input.items.map((i) => i.wearerId).filter((w): w is string => !!w))];
      if (wearerIds.length) {
        const found = await tx.householdMember.count({ where: { tenantId, id: { in: wearerIds }, customerId: input.customerId, archivedAt: null } });
        if (found !== wearerIds.length) throw badRequest('INVALID_WEARER', "A wearer is not a member of this customer's household");
      }

      // Exact integer minor-unit arithmetic; never floating point.
      let subtotal = 0n; let tax = 0n; let total = 0n;
      const lines = input.items.map((i) => {
        let r;
        try {
          r = computeLine({ unitPrice: i.unitPrice, quantity: i.quantity, discount: i.discount, taxPercent: i.taxPercent ?? settings.defaultTaxPercent.toString() }, settings.taxInclusive);
        } catch (e) { throw badRequest('INVALID_LINE', (e as Error).message); }
        subtotal += parseMoney(r.net); tax += parseMoney(r.tax); total += parseMoney(r.total);
        return { i, r };
      });

      const orderNumber = await nextNumber(tx, tenantId, 'order', settings.orderPrefix, 5);
      const order = await tx.order.create({
        data: {
          tenantId, branchId, orderNumber, kind: input.kind, customerId: input.customerId, priority: input.priority,
          trialDate: input.trialDate ? new Date(input.trialDate) : undefined,
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
          notes: input.notes, subtotal: formatMoney(subtotal), tax: formatMoney(tax), total: formatMoney(total),
          createdBy: ctx.userId, updatedBy: ctx.userId,
          items: {
            create: lines.map(({ i, r }) => ({
              tenantId, garmentType: i.garmentType, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount,
              taxPercent: i.taxPercent ?? settings.defaultTaxPercent.toString(), taxAmount: r.tax, lineTotal: r.total,
              wearerId: i.wearerId, fabricSource: i.fabricSource, fabricDetails: i.fabricDetails,
            })),
          },
          history: { create: { tenantId, fromStatus: null, toStatus: 'DRAFT', note: 'Order created', changedBy: ctx.userId } },
        },
      });
      await this.audit.recordTx(tx, { action: 'order.created', entityType: 'order', entityId: order.id, metadata: { orderNumber, total: formatMoney(total), items: input.items.length } });
      return this.detail(tx, tenantId, order.id);
    });
  }

  private async resolveBranch(tx: Tx, tenantId: string, requested?: string) {
    if (requested) {
      const b = await tx.branch.findFirst({ where: { id: requested, tenantId, archivedAt: null }, select: { id: true } });
      if (!b) throw badRequest('INVALID_BRANCH', 'Branch not found');
      return b.id;
    }
    const scope = currentContext().branchIds;
    const b = await tx.branch.findFirst({
      where: { tenantId, archivedAt: null, ...(scope.length ? { id: { in: scope } } : {}) }, orderBy: { createdAt: 'asc' }, select: { id: true },
    });
    if (!b) throw badRequest('NO_BRANCH', 'No active branch available for this order');
    return b.id;
  }

  async list(p: OrderListParams) {
    const tenantId = currentTenantId();
    const where: Prisma.OrderWhereInput = { tenantId, ...branchFilter() };
    if (p.status) where.status = p.status;
    if (p.customerId) where.customerId = p.customerId;
    if (p.q) where.OR = [
      { orderNumber: { contains: p.q, mode: 'insensitive' } },
      { customer: { fullName: { contains: p.q, mode: 'insensitive' } } },
    ];
    return this.db.run(async (tx) => {
      const [total, rows, grouped] = await Promise.all([
        tx.order.count({ where }),
        tx.order.findMany({
          where, orderBy: [{ createdAt: p.dir }, { id: 'asc' }], skip: (p.page - 1) * p.pageSize, take: p.pageSize,
          include: { customer: { select: { id: true, fullName: true, customerNumber: true } }, _count: { select: { items: true } } },
        }),
        tx.order.groupBy({ by: ['status'], where: { tenantId, ...branchFilter() }, _count: { _all: true } }),
      ]);
      return {
        total,
        statusCounts: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
        data: rows.map((o) => ({
          id: o.id, orderNumber: o.orderNumber, status: o.status, kind: o.kind, priority: o.priority, total: money(o.total),
          deliveryDate: o.deliveryDate, createdAt: o.createdAt, itemCount: o._count.items, customer: o.customer,
        })),
      };
    });
  }

  get(id: string) {
    const tenantId = currentTenantId();
    return this.db.run((tx) => this.detail(tx, tenantId, id));
  }

  private async detail(tx: Tx, tenantId: string, id: string) {
    const o = await tx.order.findFirst({
      where: { id, tenantId, ...branchFilter() },
      include: {
        customer: { select: { id: true, fullName: true, customerNumber: true, mobile: true } },
        items: { orderBy: { id: 'asc' } },
        history: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!o) throw notFound('Order');
    const ids = o.history.map((h) => h.changedBy).filter((x): x is string => !!x);
    const users = ids.length ? await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } }) : [];
    const nameOf = new Map(users.map((u) => [u.id, u.fullName]));
    return {
      id: o.id, orderNumber: o.orderNumber, status: o.status, kind: o.kind, priority: o.priority, branchId: o.branchId, version: o.version,
      orderDate: o.orderDate, trialDate: o.trialDate, deliveryDate: o.deliveryDate, notes: o.notes,
      subtotal: money(o.subtotal), discount: money(o.discount), tax: money(o.tax), total: money(o.total), paidAmount: money(o.paidAmount),
      paymentStatus: o.paymentStatus, deliveryStatus: o.deliveryStatus, createdAt: o.createdAt, customer: o.customer,
      allowedTransitions: TRANSITIONS[o.status as OrderStatus] ?? [],
      items: o.items.map((i) => ({
        id: i.id, garmentType: i.garmentType, quantity: i.quantity, unitPrice: money(i.unitPrice), discount: money(i.discount),
        taxPercent: i.taxPercent.toString(), taxAmount: money(i.taxAmount), lineTotal: money(i.lineTotal), stage: i.stage,
        wearerId: i.wearerId, fabricSource: i.fabricSource, fabricDetails: i.fabricDetails,
      })),
      history: o.history.map((h) => ({ id: h.id, fromStatus: h.fromStatus, toStatus: h.toStatus, note: h.note, at: h.createdAt, by: h.changedBy ? nameOf.get(h.changedBy) ?? null : null })),
    };
  }

  /** Permissions (any one suffices) required for a transition, beyond the route's order.view. */
  private requiredPerm(from: OrderStatus, to: OrderStatus): string[] {
    if (to === 'CANCELLED') return ['order.cancel'];
    if (to === 'PARTIALLY_DELIVERED' || to === 'DELIVERED' || to === 'CLOSED') return ['order.deliver'];
    if (from === 'DRAFT') return ['order.update', 'order.status']; // either may confirm a draft
    return ['order.status'];
  }

  async transition(id: string, input: OrderTransitionInput) {
    const tenantId = currentTenantId();
    const ctx = currentContext();
    return this.db.run(async (tx) => {
      const o = await tx.order.findFirst({ where: { id, tenantId, ...branchFilter() } });
      if (!o) throw notFound('Order');
      const from = o.status as OrderStatus;
      const to = input.toStatus;
      const need = this.requiredPerm(from, to);
      if (!need.some((p) => (ctx.permissions as string[]).includes(p))) throw forbidden('You do not have permission to make that status change');
      if (o.version !== input.version) throw conflict('VERSION_CONFLICT', 'This order was changed by someone else. Reload and try again.', { currentVersion: o.version });
      if (!canTransition(from, to)) {
        throw unprocessable('INVALID_TRANSITION', `An order cannot move from ${from} to ${to}`, { from, to, allowed: TRANSITIONS[from] });
      }
      if (to === 'CANCELLED' && !input.note) throw badRequest('REASON_REQUIRED', 'Give a reason when cancelling an order');

      const res = await tx.order.updateMany({
        where: { id, tenantId, version: input.version },
        data: {
          status: to, version: { increment: 1 }, updatedBy: ctx.userId,
          ...(to === 'DELIVERED' ? { deliveryStatus: 'DELIVERED' } : to === 'PARTIALLY_DELIVERED' ? { deliveryStatus: 'PARTIAL' } : {}),
        },
      });
      if (res.count !== 1) throw conflict('VERSION_CONFLICT', 'This order was changed by someone else. Reload and try again.');
      // Whole-order stages in this slice: items follow the order status (per-item stages come later).
      await tx.orderItem.updateMany({ where: { tenantId, orderId: id }, data: { stage: to } });
      // Status history is append-only: add a row, never edit.
      await tx.orderStatusHistory.create({ data: { tenantId, orderId: id, fromStatus: from, toStatus: to, note: input.note, changedBy: ctx.userId } });
      await this.audit.recordTx(tx, { action: 'order.status_changed', entityType: 'order', entityId: id, metadata: { orderNumber: o.orderNumber, from, to, note: input.note } });
      return this.detail(tx, tenantId, id);
    });
  }
}
