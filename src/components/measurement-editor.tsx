"use client";
import type { MeasureField } from "@/lib/measurements";

export type MeasureValues = Record<string, string>;

/** Controlled grid of measurement inputs (cm). Used in the order wizard, order detail and profiles. */
export function MeasurementEditor(props: {
  fields: MeasureField[];
  values: MeasureValues;
  onChange: (v: MeasureValues) => void;
  notes?: string;
  onNotes?: (n: string) => void;
  hints?: string[];
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {props.hints?.map((h) => (
        <p key={h} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{h}</p>
      ))}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {props.fields.map((f) => (
          <label key={f.key} className="text-sm font-medium">
            {f.label} <span className="font-normal text-stone-500">(cm)</span>
            <input
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              disabled={props.disabled}
              value={props.values[f.key] ?? ""}
              onChange={(e) => props.onChange({ ...props.values, [f.key]: e.target.value.replace(/[^0-9.]/g, "") })}
              className="field"
              aria-label={`${f.label} in centimetres`}
            />
          </label>
        ))}
      </div>
      {props.onNotes && (
        <label className="text-sm font-medium">
          Fit notes
          <input value={props.notes ?? ""} onChange={(e) => props.onNotes!(e.target.value)} disabled={props.disabled} className="field" placeholder="e.g. loose fit, extra ease at waist" maxLength={500} />
        </label>
      )}
    </div>
  );
}

export const toStrings = (v: Record<string, number> | null | undefined): MeasureValues =>
  Object.fromEntries(Object.entries(v ?? {}).map(([k, n]) => [k, String(n)]));
