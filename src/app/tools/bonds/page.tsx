import { BondCalculator } from "@/components/bond-calculator";
import { BondMarketExplorer } from "@/components/bond-market-explorer";

export default function BondsPage() {
  return (
    <section className="space-y-4">
      <BondCalculator />
      <BondMarketExplorer />
    </section>
  );
}
