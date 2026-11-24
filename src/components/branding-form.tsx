"use client";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

export interface BrandingValues {
  name: string; phone: string | null; address: string | null; city: string | null; gstin: string | null;
  brandColor: string; logoDataUrl: string | null; bannerEnabled: boolean; bannerText: string | null; bannerTone: string;
}

const PRESETS = ["#7c2d5b", "#0f766e", "#1d4ed8", "#b45309", "#be123c", "#4338ca", "#166534", "#27272a"];
const TONES: Record<string, string> = { info: "bg-sky-100 text-sky-900", promo: "bg-amber-100 text-amber-900", warning: "bg-red-100 text-red-900" };
const MAX_LOGO = 150 * 1024;

export function BrandingForm({ initial }: { initial: BrandingValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [logoChanged, setLogoChanged] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof BrandingValues>(k: K, val: BrandingValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setMsg({ ok: false, text: "Use a PNG, JPEG or WebP logo." });
    if (file.size > MAX_LOGO) return setMsg({ ok: false, text: "Logo must be smaller than 150 KB." });
    const r = new FileReader();
    r.onload = () => { set("logoDataUrl", String(r.result)); setLogoChanged(true); setMsg(null); };
    r.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api("/api/settings/branding", {
        method: "PUT",
        body: {
          name: v.name, phone: v.phone || null, address: v.address || null, city: v.city || null, gstin: v.gstin || null,
          brandColor: v.brandColor, bannerEnabled: v.bannerEnabled, bannerText: v.bannerText || null, bannerTone: v.bannerTone,
          ...(logoChanged ? { logoDataUrl: v.logoDataUrl } : {}),
        },
      });
      setMsg({ ok: true, text: "Saved. Your theme is live for everyone in your business." });
      setLogoChanged(false);
      router.refresh();
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
      <div className="grid content-start gap-3">
        <h2 className="font-medium">Business profile</h2>
        <label className="text-sm font-medium">Business name<input className="field" value={v.name} onChange={(e) => set("name", e.target.value)} required minLength={2} maxLength={120} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Phone<input className="field" inputMode="tel" value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></label>
          <label className="text-sm font-medium">City<input className="field" value={v.city ?? ""} onChange={(e) => set("city", e.target.value)} /></label>
        </div>
        <label className="text-sm font-medium">Address<input className="field" value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} maxLength={300} /></label>
        <label className="text-sm font-medium">GSTIN (optional)<input className="field uppercase" value={v.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} maxLength={15} /></label>

        <h2 className="mt-2 font-medium">Logo</h2>
        <div className="flex items-center gap-3">
          {v.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.logoDataUrl} alt="Logo preview" className="h-16 w-16 rounded border border-stone-200 object-contain" />
          ) : <span className="flex h-16 w-16 items-center justify-center rounded bg-brand text-2xl font-semibold text-white">{v.name.slice(0, 1)}</span>}
          <div className="grid gap-1">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onLogo(e.target.files?.[0])} aria-label="Upload logo" className="text-sm" />
            {v.logoDataUrl && <button type="button" className="w-fit text-xs text-red-700 underline" onClick={() => { set("logoDataUrl", null); setLogoChanged(true); }}>Remove logo</button>}
            <span className="text-xs text-stone-500">PNG, JPEG or WebP, up to 150 KB.</span>
          </div>
        </div>
      </div>

      <div className="grid content-start gap-3">
        <h2 className="font-medium">Theme colour</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((c) => (
            <button key={c} type="button" onClick={() => set("brandColor", c)} aria-label={`Use colour ${c}`} aria-pressed={v.brandColor === c}
              style={{ background: c }} className={`h-9 w-9 rounded-full border-2 ${v.brandColor === c ? "border-stone-900" : "border-white shadow"}`} />
          ))}
          <input type="color" value={v.brandColor} onChange={(e) => set("brandColor", e.target.value)} aria-label="Custom colour" className="h-9 w-12 rounded" />
        </div>

        <h2 className="mt-2 font-medium">Top banner</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.bannerEnabled} onChange={(e) => set("bannerEnabled", e.target.checked)} /> Show a banner at the top of every screen</label>
        <label className="text-sm font-medium">Banner text<input className="field" value={v.bannerText ?? ""} onChange={(e) => set("bannerText", e.target.value)} maxLength={200} placeholder="e.g. Diwali bookings close 20 Oct" /></label>
        <label className="text-sm font-medium">Style
          <select className="field" value={v.bannerTone} onChange={(e) => set("bannerTone", e.target.value)}>
            <option value="info">Information (blue)</option><option value="promo">Offer (amber)</option><option value="warning">Notice (red)</option>
          </select>
        </label>

        <h2 className="mt-2 font-medium">Preview</h2>
        <div style={{ "--brand": v.brandColor } as CSSProperties} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          {v.bannerEnabled && v.bannerText && <div className={`px-3 py-2 text-center text-sm ${TONES[v.bannerTone]}`}>{v.bannerText}</div>}
          <div className="flex items-center gap-3 border-b border-stone-200 p-3">
            {v.logoDataUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={v.logoDataUrl} alt="" className="h-9 w-9 rounded object-contain" />
              : <span className="flex h-9 w-9 items-center justify-center rounded bg-brand font-semibold text-white">{v.name.slice(0, 1)}</span>}
            <span className="font-semibold">{v.name}</span>
          </div>
          <div className="flex gap-2 p-3"><span className="rounded-lg bg-brand px-3 py-2 text-sm text-white">+ New order</span><span className="rounded-lg bg-brand-light px-3 py-2 text-sm">Orders</span></div>
        </div>
      </div>

      <div className="grid gap-2 lg:col-span-2">
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.text}</p>}
        <div><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save settings"}</Button></div>
      </div>
    </form>
  );
}
