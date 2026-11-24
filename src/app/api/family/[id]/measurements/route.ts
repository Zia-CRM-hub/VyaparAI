import { NextResponse } from "next/server";
import { idParamSchema, measurementSaveSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { getMeasurementWorkspace, listMeasurementHistory, saveMeasurement } from "@/server/services/measurements";
import { getRequestContext } from "@/server/session";

type P = { id: string };

/** ?garment=kurti -> template + latest + versions for that garment; without it -> all versions. */
export const GET = secured<P>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const garment = req.nextUrl.searchParams.get("garment");
  return NextResponse.json({
    data: garment ? await getMeasurementWorkspace(ctx, id, garment) : await listMeasurementHistory(ctx, id),
  });
});

export const POST = secured<P>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const r = await saveMeasurement(ctx, id, await readJson(req, measurementSaveSchema));
  return NextResponse.json({ data: r.set, created: r.created }, { status: r.created ? 201 : 200 });
});
