import { MarketRegimeDashboard } from "@/components/market-regime/market-regime-dashboard";
import {
  getProviderConfigs,
  getProviderSelectorOptions,
} from "@/lib/market-data/provider-config";

export const dynamic = "force-dynamic";

export default function MarketRegimePage() {
  return (
    <MarketRegimeDashboard
      providerConfigs={getProviderConfigs()}
      providerSelectorOptions={getProviderSelectorOptions()}
    />
  );
}

