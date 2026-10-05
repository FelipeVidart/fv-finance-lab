import { NextResponse } from "next/server";
import { DEFAULT_FACTOR_DEFINITIONS } from "@/lib/finance/risk/factor-gradvar";
import { getBatchHistoricalPrices, convertBatchToHistoricalSeries } from "@/lib/market-data/market-data-service";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 500) throw new Error("Solicitud inválida.");
    const { start, end } = JSON.parse(raw);
    const valid = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
    if (!valid(start) || !valid(end) || end <= start || Date.parse(end)-Date.parse(start)>370*86400000) throw new Error("Ventana de factores inválida.");
    const symbols = DEFAULT_FACTOR_DEFINITIONS.map(f=>f.proxyTicker);
    const batch = await getBatchHistoricalPrices({ symbols, startDate:start, endDate:end, interval:"1day", provider:"yahoo" });
    const missing = symbols.filter(s=>!batch.results[s] || batch.results[s].metadata.currency!=="USD");
    if (missing.length) throw new Error(`No hay históricos USD confirmados para: ${missing.join(", ")}. No se calcula un modelo incompleto.`);
    const data = buildExplorerPayload({ period:"1Y", series:convertBatchToHistoricalSeries(batch), provider:"Yahoo", warnings:batch.warnings });
    data.meta.priceCurrency="USD";
    return NextResponse.json({ok:true,data});
  } catch(e) { return NextResponse.json({ok:false,error:e instanceof Error?e.message:"No se pudo calcular factores."},{status:400}); }
}
