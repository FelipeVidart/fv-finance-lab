"use client";

import { useState } from "react";
import { analyzeManualBond } from "@/lib/finance/argentina-fixed-income";

const defaults = { ticker: "Synthetic example", family: "Hard dollar / ON", unit: "USD", cleanPrice: "95", accruedInterest: "0", technicalValue: "100" };
const defaultFlows = [
  { time: "0.5", coupon: "3", principal: "0", id: 0 },
  { time: "1", coupon: "3", principal: "0", id: 1 },
  { time: "1.5", coupon: "3", principal: "50", id: 2 },
  { time: "2", coupon: "1.5", principal: "50", id: 3 },
];
const control = "w-full min-w-0 rounded-lg border border-white/15 bg-background-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export function ArgentinaFixedIncomeSection() {
  const [form, setForm] = useState(defaults);
  const [flows, setFlows] = useState(defaultFlows);
  const [nextId, setNextId] = useState(4);
  let result: ReturnType<typeof analyzeManualBond> | null = null;
  let error: string | null = null;
  try {
    if ([form.cleanPrice, form.accruedInterest, form.technicalValue, ...flows.flatMap((flow) => [flow.time, flow.coupon, flow.principal])].some((value) => !value.trim())) {
      throw new Error("Complete every numeric field.");
    }
    result = analyzeManualBond({ cleanPrice: Number(form.cleanPrice), accruedInterest: Number(form.accruedInterest), technicalValue: Number(form.technicalValue),
      cashFlows: flows.map((flow) => ({ time: Number(flow.time), coupon: Number(flow.coupon), principal: Number(flow.principal) })) });
  } catch (cause) { error = cause instanceof Error ? cause.message : "Unable to calculate."; }
  const money = (value: number) => `${form.unit} ${value.toFixed(2)}`;
  return (
    <div id="argentina-panel" role="tabpanel" aria-labelledby="argentina-tab" className="space-y-6">
      <header><h3 className="text-xl font-semibold text-foreground">Argentina fixed-income desk</h3><p className="mt-2 text-sm text-foreground-muted">Manual settlement inputs and cash flows. Synthetic example, not live market data.</p></header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["ticker", "cleanPrice", "accruedInterest", "technicalValue"] as const).map((key) => <label key={key} className="space-y-2 text-sm text-foreground">
          <span className="block">{({ ticker: "Instrument", cleanPrice: "Clean price", accruedInterest: "Accrued interest", technicalValue: "Technical value (including accrued)" })[key]}</span>
          <input className={control} type={key === "ticker" ? "text" : "number"} step="any" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </label>)}
        <label className="space-y-2 text-sm text-foreground"><span className="block">Family</span><select className={control} value={form.family} onChange={(event) => setForm({ ...form, family: event.target.value })}>
          {["Hard dollar / ON", "Fixed-rate ARS", "CER (constant-index units)", "Dollar linked (USD-linked units)"].map((label) => <option key={label}>{label}</option>)}
        </select></label>
        <label className="space-y-2 text-sm text-foreground"><span className="block">Cash-flow unit</span><select className={control} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
          {["USD", "ARS", "Index units"].map((unit) => <option key={unit}>{unit}</option>)}
        </select></label>
      </div>
      <p className="text-sm text-foreground-muted">Use the same unit and nominal holding for every amount. Time is years from settlement; yield uses annual effective compounding.</p>
      {form.family.startsWith("CER") || form.family.startsWith("Dollar") ? <p role="note" className="text-sm text-amber-200">Indexed analysis: enter price and flows in constant-index units. Yield excludes future inflation or FX changes, not a nominal ARS return forecast.</p> : null}
      <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm text-foreground">
        <caption className="pb-3 text-left font-semibold">Future cash flows</caption>
        <thead><tr>{["Years", "Coupon", "Principal", ""].map((label, index) => <th key={index} className="p-2">{label}</th>)}</tr></thead>
        <tbody>{flows.map((flow) => <tr key={flow.id}>
          {(["time", "coupon", "principal"] as const).map((key) => <td key={key} className="p-2"><input type="number" step="any" aria-label={`${key} for flow ${flow.id + 1}`} className={control} value={flow[key]} onChange={(event) => setFlows(flows.map((entry) => entry.id === flow.id ? { ...entry, [key]: event.target.value } : entry))} /></td>)}
          <td className="p-2"><button type="button" title="Remove cash flow" aria-label={`Remove flow ${flow.id + 1}`} className="p-2 text-rose-300" onClick={() => setFlows(flows.filter((entry) => entry.id !== flow.id))}>X</button></td>
        </tr>)}</tbody>
      </table></div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-foreground" disabled={flows.length >= 500} onClick={() => { setFlows([...flows, { id: nextId, time: "", coupon: "0", principal: "0" }]); setNextId(nextId + 1); }}>Add cash flow</button>
        <button type="button" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-foreground" onClick={() => { setForm(defaults); setFlows(defaultFlows); setNextId(4); }}>Reset example</button>
      </div>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      {result ? <>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Dirty price", money(result.dirtyPrice)], ["Annual effective YTM", percent(result.yieldRate)], ["Parity", percent(result.parity)], ["Next 12m coupon / clean price", percent(result.nextYearCouponYield)], ["Macaulay duration", `${result.macaulayDuration.toFixed(3)} years`], ["Modified duration", result.modifiedDuration.toFixed(3)], ["Total contractual payments", money(result.totalPayments)], ["Net undiscounted payments", money(result.totalPayments - result.dirtyPrice)]].map(([label, value]) => <div key={label} className="border-t border-white/15 pt-3"><dt className="text-xs text-foreground-muted">{label}</dt><dd className="mt-2 font-semibold text-foreground">{value}</dd></div>)}
        </dl>
        <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm text-foreground">
          <caption className="pb-3 text-left font-semibold">Immediate yield / spread shocks</caption>
          <thead><tr>{["Shock", "Yield", "Dirty price", "Repriced change", "Duration estimate"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead>
          <tbody>{result.scenarios.map((row) => <tr key={row.basisPoints} className="border-t border-white/10"><td className="p-3">{row.basisPoints} bp</td><td className="p-3">{percent(row.yieldRate)}</td><td className="p-3">{row.price === null ? "N/A" : money(row.price)}</td><td className="p-3">{row.priceReturn === null ? "N/A" : percent(row.priceReturn)}</td><td className="p-3">{percent(row.durationEstimate)}</td></tr>)}</tbody>
        </table></div>
      </> : null}
      <p className="text-xs leading-6 text-foreground-muted">YTM is conditional on the entered payments, not a guaranteed return. Scenarios reprice unchanged flows at settlement, excluding carry, reinvestment, default, fees and taxes. No contractual schedule or suitability is inferred from the instrument name.</p>
    </div>
  );
}
