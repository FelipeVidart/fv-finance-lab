import { NextResponse } from "next/server";
import { getBatchHistoricalPrices } from "@/lib/market-data/market-data-service";
import { resolvePeriodDateRange } from "@/lib/market-data/request";
import { isPortfolioDraft, validateDraft } from "@/lib/workspace/portfolio-draft";
import { previewProviderHistory } from "@/lib/workspace/history-preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Only metadata/tickers reach this route. Never transmit allocation amounts to a provider.
    const raw = await request.text();
    if (raw.length > 50000) return NextResponse.json({ ok: false, error: "Solicitud demasiado grande." }, { status: 400 });
    const draft: unknown = JSON.parse(raw);
    if (!isPortfolioDraft(draft)) return NextResponse.json({ ok: false, error: "Cartera inválida." }, { status: 400 });
    const { included } = validateDraft(draft);
    const symbols = included.map(p => draft.currency === "ARS" && !p.ticker.endsWith(".BA") ? `${p.ticker}.BA` : p.ticker);
    const range = resolvePeriodDateRange(draft.period);
    const batch = await getBatchHistoricalPrices({ symbols, ...range, interval: "1day", provider: "yahoo" });
    return NextResponse.json({ ok: true, preview: previewProviderHistory(draft, batch) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo revisar el histórico." }, { status: 400 });
  }
}
