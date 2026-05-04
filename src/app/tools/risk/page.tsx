import { RiskModuleShell } from "@/components/risk-module-shell";
import {
  getProviderConfigs,
  getProviderSelectorOptions,
} from "@/lib/market-data/provider-config";

export const dynamic = "force-dynamic";

export default function RiskPage() {
  return (
    <RiskModuleShell
      providerConfigs={getProviderConfigs()}
      providerSelectorOptions={getProviderSelectorOptions()}
    />
  );
}
