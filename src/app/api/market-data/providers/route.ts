import { NextResponse } from "next/server";
import {
  getAutoProviderPriority,
  getProviderConfigs,
  getProviderSelectorOptions,
} from "@/lib/market-data/provider-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      providers: getProviderConfigs(),
      selectorOptions: getProviderSelectorOptions(),
      autoProviderPriority: getAutoProviderPriority(),
    },
  });
}
