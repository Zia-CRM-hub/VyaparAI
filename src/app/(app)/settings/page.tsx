import { BrandingForm } from "@/components/branding-form";
import { PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/server/page-context";
import { getBranding } from "@/server/services/branding";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requirePageContext("tenant:manage");
  const b = await getBranding(ctx.tenantId);
  return (
    <div className="grid gap-4">
      <PageHeader title="Settings" subtitle="Business profile, logo, theme and top banner. Only your business sees these." />
      <Card><BrandingForm initial={b} /></Card>
    </div>
  );
}
