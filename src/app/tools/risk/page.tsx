import { RiskModuleShell } from "@/components/risk-module-shell";

export const dynamic = "force-dynamic";

export default function RiskPage() {
  return <RiskModuleShell stooqConfigured={Boolean(process.env.STOOQ_API_KEY)} />;
}
