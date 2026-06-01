import { Card } from "@/components/card";
import { SurfaceCard } from "@/components/ui/surface-card";

export function RegimeMethodologyCard() {
  return (
    <Card
      eyebrow="Methodology"
      title="Methodology & limitations"
      description="The dashboard classifies current observable conditions with deterministic rules. It does not forecast returns, estimate probabilities, or recommend trades."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SurfaceCard padding="sm" className="border-white/[0.08]">
          <p className="text-sm font-semibold text-foreground">Model design</p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            The score combines five blocks: equity trend, risk momentum,
            volatility, credit conditions, and rates/duration. Each indicator is
            clipped between -1 and +1, then averaged inside its block.
          </p>
        </SurfaceCard>

        <SurfaceCard padding="sm" className="border-white/[0.08]">
          <p className="text-sm font-semibold text-foreground">Data handling</p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            The model uses 18 months of daily closes and aligns every series on
            shared trading dates before calculating returns, moving averages,
            drawdowns, volatility, and relative returns.
          </p>
        </SurfaceCard>

        <SurfaceCard padding="sm" className="border-white/[0.08]">
          <p className="text-sm font-semibold text-foreground">Limitations</p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            Provider gaps, delayed closes, VIX availability, and ETF proxy
            limitations can affect the classification. This is not investment
            advice and should not be used as a buy or sell signal.
          </p>
        </SurfaceCard>
      </div>
    </Card>
  );
}

