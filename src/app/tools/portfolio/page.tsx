import { PortfolioComparisonSection } from "@/components/portfolio/portfolio-comparison-section";
import {
  getProviderConfigs,
  getProviderSelectorOptions,
} from "@/lib/market-data/provider-config";

export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <PortfolioComparisonSection
      providerConfigs={getProviderConfigs()}
      providerSelectorOptions={getProviderSelectorOptions()}
    />
  );
}
