import { OrderWizard } from "@/components/order-wizard";
import { PageHeader } from "@/components/ui/bits";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { getCustomer } from "@/server/services/customers";
import { listAssignableStaff } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ customerId?: string; memberId?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext("order:write");
  const [staff, customer] = await Promise.all([
    listAssignableStaff(ctx),
    sp.customerId ? getCustomer(ctx, sp.customerId).catch(() => null) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-4">
      <PageHeader title="New order" subtitle="Customer, family member, measurements, order and advance on one screen" />
      <OrderWizard
        staff={staff}
        canPay={can(ctx, "payment:write")}
        canCreateCustomer={can(ctx, "customer:write")}
        initialCustomer={customer ? { id: customer.id, name: customer.name, phone: customer.phone } : undefined}
        initialMemberId={sp.memberId}
      />
    </div>
  );
}
