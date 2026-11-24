import { Prisma, type OrderStatus } from "@prisma/client";
import {
  canTransition, daysUntil, fromPaise, isOpen, orderLabel, paymentSummary, toPaise, todayUtc,
  type OrderStatus as Status,
} from "@/lib/orders";
import type { OrderCreateInput, OrderUpdateInput, PaymentCreateInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, can, canAccessBranch, type AuthContext } from "../context";
import { prisma } from "../db";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { tenantDb } from "../tenant-db";
import { getCustomer } from "./customers";
import { resolveTemplate, saveVersion } from "./measurements";

const ASSIGNABLE_ROLES = ["TAILOR", "PRODUCTION_MANAGER", "MANAGER", "OWNER"];

const viewInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  member: { select: { id: true, name: true, relation: true, gender: true, ageGroup: true } },
  assignedTo: { select: { id: true, user: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof viewInclude }>;

/** Row-level visibility: tailors see only their own jobs, branch-scoped users only their branches. */
function visibility(ctx: AuthContext): Prisma.OrderWhereInput {
  const w: Prisma.OrderWhereInput = {};
  if (ctx.roleKey === "TAILOR") w.assignedMembershipId = ctx.membershipId;
  if (!ctx.allBranches) w.branchId = { in: [...ctx.branchIds] };
  return w;
}

async function paidByOrder(tenantId: string, orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, Prisma.Decimal>();
  const rows = await tenantDb(tenantId).payment.groupBy({
    by: ["orderId"],
    where: { orderId: { in: orderIds } },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.orderId, r._sum.amount ?? new Prisma.Decimal(0)]));
}

function toView(o: OrderRow, paid: Prisma.Decimal | undefined) {
  const pay = paymentSummary(o.charges, paid ?? 0);
  return {
    id: o.id,
    orderNo: o.orderNo,
    label: orderLabel(o.orderNo),
    status: o.status as Status,
    garment: o.garment,
    description: o.description,
    promisedDate: o.promisedDate,
    daysLeft: daysUntil(o.promisedDate),
    customer: o.customer,
    member: o.member,
    assignedTo: o.assignedTo ? { id: o.assignedTo.id, name: o.assignedTo.user.name } : null,
    branchId: o.branchId,
    measurementSetId: o.measurementSetId,
    deliveredAt: o.deliveredAt,
    createdAt: o.createdAt,
    ...pay,
  };
}
export type OrderView = ReturnType<typeof toView>;

async function viewMany(ctx: AuthContext, rows: OrderRow[]): Promise<OrderView[]> {
  const paid = await paidByOrder(ctx.tenantId, rows.map((r) => r.id));
  return rows.map((r) => toView(r, paid.get(r.id)));
}

// ───────────── Queries ─────────────

export interface OrderFilters {
  q?: string;
  statuses?: Status[];
  overdue?: boolean;
  dueWithinDays?: number;
  unpaid?: boolean;
  customerId?: string;
  mine?: boolean;
  take?: number;
}

export async function listOrders(ctx: AuthContext, f: OrderFilters = {}): Promise<OrderView[]> {
  assertCan(ctx, "order:read");
  const and: Prisma.OrderWhereInput[] = [visibility(ctx)];
  if (f.statuses?.length) and.push({ status: { in: f.statuses as OrderStatus[] } });
  if (f.customerId) and.push({ customerId: f.customerId });
  if (f.mine) and.push({ assignedMembershipId: ctx.membershipId });
  if (f.overdue) and.push({ promisedDate: { lt: todayUtc() }, status: { notIn: ["DELIVERED", "CANCELLED"] } });
  if (f.dueWithinDays !== undefined) {
    const end = new Date(todayUtc().getTime() + f.dueWithinDays * 86_400_000);
    and.push({ promisedDate: { lte: end }, status: { notIn: ["DELIVERED", "CANCELLED"] } });
  }
  const q = f.q?.trim();
  if (q) {
    const num = /^#?\d{1,9}$/.test(q) ? Number(q.replace("#", "")) : null;
    and.push({
      OR: [
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q } } },
        { member: { name: { contains: q, mode: "insensitive" } } },
        ...(num !== null ? [{ orderNo: num }] : []),
      ],
    });
  }
  const rows = await tenantDb(ctx.tenantId).order.findMany({
    where: { AND: and },
    include: viewInclude,
    orderBy: [{ promisedDate: "asc" }, { orderNo: "desc" }],
    take: Math.min(f.take ?? 100, 300),
  });
  let views = await viewMany(ctx, rows);
  if (f.unpaid) views = views.filter((v) => v.paymentStatus !== "PAID" && v.status !== "CANCELLED");
  return views;
}

export async function getOrder(ctx: AuthContext, id: string) {
  assertCan(ctx, "order:read");
  const o = await tenantDb(ctx.tenantId).order.findFirst({
    where: { id, ...visibility(ctx) },
    include: {
      ...viewInclude,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      measurement: true,
    },
  });
  if (!o) throw new NotFoundError("Order not found");
  const paid = o.payments.reduce((s, p) => s + toPaise(p.amount), 0n);
  const { payments, history, measurement, ...row } = o;
  return {
    ...toView(row as OrderRow, new Prisma.Decimal(fromPaise(paid))),
    payments,
    history,
    measurement: measurement && {
      id: measurement.id, version: measurement.version, values: measurement.values as Record<string, number>,
      notes: measurement.notes, createdAt: measurement.createdAt,
    },
  };
}

/** Staff who can be assigned work (for pickers). */
export async function listAssignableStaff(ctx: AuthContext) {
  assertCan(ctx, "order:read");
  const rows = await tenantDb(ctx.tenantId).membership.findMany({
    where: { status: "ACTIVE", role: { key: { in: ASSIGNABLE_ROLES } } },
    include: { user: { select: { name: true } }, role: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({ id: m.id, name: m.user.name, role: m.role.name }));
}

// ───────────── Commands ─────────────

async function assertAssignable(ctx: AuthContext, membershipId: string) {
  const m = await tenantDb(ctx.tenantId).membership.findFirst({
    where: { id: membershipId, status: "ACTIVE" },
    include: { role: { select: { key: true } } },
  });
  if (!m || !ASSIGNABLE_ROLES.includes(m.role.key)) throw new NotFoundError("Staff member not found");
}

function parseDate(d: string): Date {
  const date = new Date(`${d}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new AppError(400, "invalid_date", "Invalid date");
  return date;
}

export async function createOrder(ctx: AuthContext, input: OrderCreateInput) {
  assertCan(ctx, "order:write");
  const db = tenantDb(ctx.tenantId);

  const customer = await getCustomer(ctx, input.customerId);
  const member = await db.familyMember.findFirst({ where: { id: input.familyMemberId, customerId: customer.id } });
  if (!member) throw new NotFoundError("Family member not found for this customer");
  resolveTemplate(member, input.garment); // garment must suit gender + age group

  const branchId = input.branchId ?? customer.branchId ?? null;
  if (branchId) {
    if (!canAccessBranch(ctx, branchId)) throw new ForbiddenError("You do not have access to that branch");
    if (!(await db.branch.findUnique({ where: { id: branchId }, select: { id: true } }))) throw new NotFoundError("Branch not found");
  } else if (!ctx.allBranches) {
    throw new ForbiddenError("Choose one of your branches");
  }
  if (input.assignedMembershipId) await assertAssignable(ctx, input.assignedMembershipId);

  const promisedDate = parseDate(input.promisedDate);
  if (promisedDate < todayUtc()) throw new AppError(400, "invalid_date", "Promised date cannot be in the past");
  const charges = toPaise(input.charges);
  if (input.advance) {
    if (!can(ctx, "payment:write")) throw new ForbiddenError("You cannot record payments");
    if (toPaise(input.advance.amount) > charges) throw new AppError(400, "invalid_amount", "Advance cannot exceed the charges");
  }

  const order = await prisma.$transaction(async (tx) => {
    // Measurement: save changes as a new version, else reuse the person's latest version for this garment.
    let measurementSetId: string | null = null;
    if (input.measurement) {
      measurementSetId = (await saveVersion(tx, ctx, member, input.garment, input.measurement.values, input.measurement.notes)).set.id;
    } else {
      const latest = await tx.measurementSet.findFirst({
        where: { tenantId: ctx.tenantId, familyMemberId: member.id, garment: input.garment },
        orderBy: { version: "desc" },
        select: { id: true },
      });
      measurementSetId = latest?.id ?? null;
    }

    const { nextOrderNo } = await tx.tenant.update({
      where: { id: ctx.tenantId },
      data: { nextOrderNo: { increment: 1 } },
      select: { nextOrderNo: true },
    });
    const o = await tx.order.create({
      data: {
        tenantId: ctx.tenantId, orderNo: nextOrderNo - 1, branchId, customerId: customer.id, familyMemberId: member.id,
        garment: input.garment, description: input.description ?? null, measurementSetId, promisedDate,
        assignedMembershipId: input.assignedMembershipId ?? null, charges: fromPaise(charges), createdById: ctx.userId,
      },
    });
    await tx.orderStatusHistory.create({
      data: { tenantId: ctx.tenantId, orderId: o.id, fromStatus: null, toStatus: "ORDER_RECEIVED", note: "Order created", actorUserId: ctx.userId },
    });
    if (input.advance) {
      await tx.payment.create({
        data: {
          tenantId: ctx.tenantId, orderId: o.id, amount: input.advance.amount, method: input.advance.method,
          reference: input.advance.reference ?? null, note: "Advance", receivedById: ctx.userId,
        },
      });
    }
    await recordAudit(
      {
        tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "order.create", entityType: "Order", entityId: o.id,
        metadata: { orderNo: o.orderNo, garment: o.garment, advance: input.advance?.amount ?? null }, ip: ctx.ip, userAgent: ctx.userAgent,
      },
      tx,
    );
    return o;
  });
  return { id: order.id, orderNo: order.orderNo };
}

export async function updateOrder(ctx: AuthContext, id: string, input: OrderUpdateInput) {
  assertCan(ctx, "order:write");
  const o = await getOrder(ctx, id);
  if (!isOpen(o.status)) throw new ConflictError("This order is closed");
  const data: Prisma.OrderUncheckedUpdateInput = {};
  if (input.assignedMembershipId !== undefined) {
    if (input.assignedMembershipId) await assertAssignable(ctx, input.assignedMembershipId);
    data.assignedMembershipId = input.assignedMembershipId;
  }
  if (input.promisedDate) {
    const d = parseDate(input.promisedDate);
    if (d < todayUtc()) throw new AppError(400, "invalid_date", "Promised date cannot be in the past");
    data.promisedDate = d;
  }
  if (input.charges) {
    if (toPaise(input.charges) < toPaise(o.paid)) throw new ConflictError("Charges cannot be less than the amount already paid");
    data.charges = input.charges;
  }
  if (input.description !== undefined) data.description = input.description;
  await tenantDb(ctx.tenantId).order.update({ where: { id }, data });
  await recordAudit({
    tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "order.update", entityType: "Order", entityId: id,
    metadata: { fields: Object.keys(input) }, ip: ctx.ip, userAgent: ctx.userAgent,
  });
}

export async function transitionOrder(ctx: AuthContext, id: string, to: Status, note?: string) {
  const o = await getOrder(ctx, id); // applies tailor/branch visibility
  if (to === "CANCELLED") assertCan(ctx, "order:write");
  else assertCan(ctx, "order:advance");
  if (!canTransition(o.status, to)) {
    throw new ConflictError(`Cannot move an order from ${o.status.replace("_", " ").toLowerCase()} to ${to.replace("_", " ").toLowerCase()}`);
  }
  if (to === "CUTTING" && !o.measurementSetId) throw new ConflictError("Take measurements before cutting");
  if (to === "DELIVERED" && toPaise(o.balance) > 0n) throw new ConflictError(`Collect the balance of ${o.balance} before delivery`);

  await prisma.$transaction(async (tx) => {
    // Compare-and-set on the current status so two people cannot both advance the same order.
    const res = await tx.order.updateMany({
      where: { id, tenantId: ctx.tenantId, status: o.status as OrderStatus },
      data: { status: to as OrderStatus, ...(to === "DELIVERED" ? { deliveredAt: new Date(), deliveryNote: note ?? null } : {}) },
    });
    if (res.count !== 1) throw new ConflictError("This order was just updated by someone else. Reload and retry.");
    await tx.orderStatusHistory.create({
      data: { tenantId: ctx.tenantId, orderId: id, fromStatus: o.status as OrderStatus, toStatus: to as OrderStatus, note: note ?? null, actorUserId: ctx.userId },
    });
    await recordAudit(
      {
        tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `order.${to.toLowerCase()}`, entityType: "Order", entityId: id,
        metadata: { from: o.status, to }, ip: ctx.ip, userAgent: ctx.userAgent,
      },
      tx,
    );
  });
}

/** Attach (or revise) measurements while the order has not gone to cutting yet. */
export async function attachMeasurement(
  ctx: AuthContext, orderId: string, values: Record<string, unknown>, notes?: string,
) {
  assertCan(ctx, "measurement:write");
  const o = await getOrder(ctx, orderId);
  if (o.status !== "ORDER_RECEIVED" && o.status !== "MEASUREMENT") {
    throw new ConflictError("Measurements are locked once cutting starts. Record changes as an alteration note.");
  }
  const member = await tenantDb(ctx.tenantId).familyMember.findUnique({ where: { id: o.member.id } });
  if (!member) throw new NotFoundError("Family member not found");
  return prisma.$transaction(async (tx) => {
    const { set } = await saveVersion(tx, ctx, member, o.garment, values, notes);
    await tx.order.updateMany({ where: { id: orderId, tenantId: ctx.tenantId }, data: { measurementSetId: set.id } });
    return { version: set.version };
  });
}

export async function addPayment(ctx: AuthContext, orderId: string, input: PaymentCreateInput) {
  assertCan(ctx, "payment:write");
  const visible = await getOrder(ctx, orderId);
  if (visible.status === "CANCELLED") throw new ConflictError("This order is cancelled");

  return prisma.$transaction(async (tx) => {
    // Row lock (parameterised, tenant-qualified) so concurrent payments cannot overpay.
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId}::uuid AND "tenantId" = ${ctx.tenantId}::uuid FOR UPDATE`;
    if (input.idempotencyKey) {
      const dup = await tx.payment.findFirst({ where: { tenantId: ctx.tenantId, idempotencyKey: input.idempotencyKey } });
      if (dup) return dup;
    }
    const order = await tx.order.findFirstOrThrow({ where: { id: orderId, tenantId: ctx.tenantId } });
    const sum = await tx.payment.aggregate({ where: { tenantId: ctx.tenantId, orderId }, _sum: { amount: true } });
    const balance = toPaise(order.charges) - toPaise(sum._sum.amount ?? 0);
    if (toPaise(input.amount) > balance) {
      throw new ConflictError(`Amount exceeds the balance of ${fromPaise(balance < 0n ? 0n : balance)}`);
    }
    const p = await tx.payment.create({
      data: {
        tenantId: ctx.tenantId, orderId, amount: input.amount, method: input.method, reference: input.reference ?? null,
        note: input.note ?? null, idempotencyKey: input.idempotencyKey ?? null, receivedById: ctx.userId,
      },
    });
    await recordAudit(
      {
        tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "payment.create", entityType: "Payment", entityId: p.id,
        metadata: { orderId, amount: input.amount, method: input.method }, ip: ctx.ip, userAgent: ctx.userAgent,
      },
      tx,
    );
    return p;
  });
}

// ───────────── Dashboard, notifications, payments overview ─────────────

export async function getOrderDashboard(ctx: AuthContext) {
  assertCan(ctx, "order:read");
  const db = tenantDb(ctx.tenantId);
  const vis = visibility(ctx);
  const today = todayUtc();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [byStatus, dueToday, overdue, ready, live, recent] = await Promise.all([
    db.order.groupBy({ by: ["status"], where: vis, _count: { _all: true } }),
    db.order.count({ where: { ...vis, promisedDate: today, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    db.order.count({ where: { ...vis, promisedDate: { lt: today }, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    db.order.count({ where: { ...vis, status: "READY" } }),
    db.order.findMany({ where: { ...vis, status: { not: "CANCELLED" } }, select: { id: true, charges: true } }),
    listOrders(ctx, { take: 6, statuses: ["ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "READY"] }),
  ]);
  const paid = await paidByOrder(ctx.tenantId, live.map((o) => o.id));
  let outstanding = 0n;
  for (const o of live) {
    const b = toPaise(o.charges) - toPaise(paid.get(o.id) ?? 0);
    if (b > 0n) outstanding += b;
  }
  const monthRows = can(ctx, "payment:write") || can(ctx, "tenant:manage")
    ? await db.payment.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } })
    : null;

  const counts: Record<string, number> = {};
  for (const r of byStatus) counts[r.status] = r._count._all;
  return {
    counts,
    dueToday,
    overdue,
    readyForDelivery: ready,
    outstanding: fromPaise(outstanding),
    collectedThisMonth: monthRows ? fromPaise(toPaise(monthRows._sum.amount ?? 0)) : null,
    upcoming: recent,
  };
}

export interface Notice {
  id: string;
  severity: "high" | "medium" | "info";
  title: string;
  detail: string;
  href: string;
}

export async function getNotifications(ctx: AuthContext): Promise<Notice[]> {
  if (!can(ctx, "order:read")) return [];
  const open = await listOrders(ctx, {
    statuses: ["ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "READY"],
    take: 300,
  });
  const out: Notice[] = [];
  for (const o of open) {
    const who = `${o.label} ${o.member.name}`;
    const href = `/orders/${o.id}`;
    if (o.daysLeft < 0) out.push({ id: `${o.id}:late`, severity: "high", title: `${who} is ${-o.daysLeft} day(s) overdue`, detail: `Promised ${o.promisedDate.toISOString().slice(0, 10)}`, href });
    else if (o.daysLeft <= 2) out.push({ id: `${o.id}:soon`, severity: "medium", title: `${who} due ${o.daysLeft === 0 ? "today" : `in ${o.daysLeft} day(s)`}`, detail: `Currently ${o.status.replace("_", " ").toLowerCase()}`, href });
    if (o.status === "READY" && toPaise(o.balance) > 0n) out.push({ id: `${o.id}:collect`, severity: "medium", title: `${who} is ready: collect balance ${o.balance}`, detail: o.customer.name, href });
    if (o.status === "TRIAL") out.push({ id: `${o.id}:trial`, severity: "info", title: `${who} awaiting trial`, detail: o.customer.name, href });
  }
  const rank = { high: 0, medium: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 100);
}

export async function listPayments(ctx: AuthContext, take = 50) {
  assertCan(ctx, "order:read");
  const vis = visibility(ctx);
  const rows = await tenantDb(ctx.tenantId).payment.findMany({
    where: { order: vis },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
    include: { order: { select: { id: true, orderNo: true, customer: { select: { name: true } } } } },
  });
  return rows.map((p) => ({
    id: p.id, amount: p.amount.toString(), method: p.method, createdAt: p.createdAt, reference: p.reference,
    orderId: p.order.id, orderLabel: orderLabel(p.order.orderNo), customer: p.order.customer.name,
  }));
}
