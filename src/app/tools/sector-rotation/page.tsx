import { SectorRotationMonitor } from "@/components/sector-rotation/sector-rotation-monitor";
import {
  getProviderConfigs,
  getProviderSelectorOptions,
} from "@/lib/market-data/provider-config";

export const dynamic = "force-dynamic";

export default function SectorRotationPage() {
  return (
    <SectorRotationMonitor
      providerConfigs={getProviderConfigs()}
      providerSelectorOptions={getProviderSelectorOptions()}
    />
  );
}
