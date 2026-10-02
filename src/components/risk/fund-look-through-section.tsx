"use client";

import { useMemo, useState } from "react";
import { analyzeFundLookThrough, type ExposureRow, type LookThroughPosition } from "@/lib/finance/risk/fund-look-through";

type HoldingForm = { id: number; instrument: string; issuer: string; currency: string; family: string; weight: string };
type PositionForm = { id: number; name: string; kind: "fund" | "direct"; weight: string; asOf: string; source: string; holdings: HoldingForm[] };
const example: PositionForm[] = [
  { id: 0, name: "Example bond fund", kind: "fund", weight: "60", asOf: "2026-10-01", source: "Synthetic example", holdings: [
    { id: 1, instrument: "Example sovereign", issuer: "Example treasury", currency: "USD", family: "Hard dollar", weight: "50" },
    { id: 2, instrument: "Example ON", issuer: "Example company", currency: "USD", family: "ON", weight: "30" },
  ] },
  { id: 3, name: "Example direct ON", kind: "direct", weight: "40", asOf: "2026-10-01", source: "Synthetic example", holdings: [
    { id: 4, instrument: "Example ON", issuer: "Example company", currency: "USD", family: "ON", weight: "100" },
  ] },
];
const control = "w-full min-w-0 rounded-lg border border-white/15 bg-background-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";
const button = "rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground";
const pct = (value: number) => `${(value * 100).toFixed(2)}%`;

export function FundLookThroughSection() {
  const [positions, setPositions] = useState(example);
  const [selectedId, setSelectedId] = useState(0);
  const [nextId, setNextId] = useState(5);
  const [analysisDate, setAnalysisDate] = useState("2026-10-02");
  const selected = positions.find((position) => position.id === selectedId);
  const calculation = useMemo(() => {
    try {
      const parsed: LookThroughPosition[] = positions.map((position) => {
        if (!position.weight.trim() || position.holdings.some((holding) => !holding.weight.trim())) {
          throw new Error("Complete allocation and holding weights.");
        }
        return { ...position, id: String(position.id), weight: Number(position.weight) / 100,
          holdings: position.holdings.map((holding) => ({ ...holding, weight: Number(holding.weight) / 100 })) };
      });
      return { result: analyzeFundLookThrough(parsed, analysisDate), error: null };
    } catch (error) { return { result: null, error: error instanceof Error ? error.message : "Unable to analyze." }; }
  }, [positions, analysisDate]);
  function updatePosition(patch: Partial<PositionForm>) {
    setPositions((current) => current.map((position) => position.id === selectedId ? { ...position, ...patch } : position));
  }
  function addPosition() {
    setPositions([...positions, { id: nextId, name: "New fund", kind: "fund", weight: "0", asOf: analysisDate, source: "", holdings: [] }]);
    setSelectedId(nextId); setNextId(nextId + 1);
  }
  return (
    <div id="funds-panel" role="tabpanel" aria-labelledby="funds-tab" className="space-y-6">
      <header><h3 className="text-xl font-semibold text-foreground">Fund holdings and look-through</h3><p className="mt-2 text-sm text-foreground-muted">Manual factsheet snapshots and direct positions. Defaults are synthetic examples.</p></header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 space-y-2 text-sm text-foreground"><span className="block">Position</span><select className={control} value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>{positions.map((position) => <option key={position.id} value={position.id}>{position.name || "Unnamed"} ({position.weight}%)</option>)}</select></label>
        <button type="button" className={button} onClick={addPosition}>Add position</button>
        <button type="button" className={button} onClick={() => { setPositions(example); setSelectedId(0); setNextId(5); setAnalysisDate("2026-10-02"); }}>Reset example</button>
        <label className="space-y-2 text-sm text-foreground"><span className="block">Analysis date</span><input type="date" className={control} value={analysisDate} onChange={(event) => setAnalysisDate(event.target.value)} /></label>
      </div>
      {selected ? <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["name", "weight", "asOf", "source"] as const).map((field) => <label key={field} className="space-y-2 text-sm text-foreground"><span className="block">{({ name: "Name / share class", weight: "Portfolio allocation (%)", asOf: "Holdings snapshot date", source: "Factsheet / source reference" })[field]}</span><input className={control} type={field === "asOf" ? "date" : field === "weight" ? "number" : "text"} step="any" value={selected[field]} onChange={(event) => updatePosition({ [field]: event.target.value })} /></label>)}
          <label className="space-y-2 text-sm text-foreground"><span className="block">Position type</span><select className={control} value={selected.kind} onChange={(event) => updatePosition({ kind: event.target.value as PositionForm["kind"] })}><option value="fund">Fund</option><option value="direct">Direct holding</option></select></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm text-foreground"><caption className="pb-3 text-left font-semibold">Underlying holdings (% within this position)</caption>
          <thead><tr>{["Instrument", "Issuer", "Currency exposure", "Family", "Weight (%)", ""].map((label, index) => <th key={index} className="p-2">{label}</th>)}</tr></thead>
          <tbody>{selected.holdings.map((holding) => <tr key={holding.id}>
            {(["instrument", "issuer", "currency", "family", "weight"] as const).map((field) => <td key={field} className="p-2"><input className={control} aria-label={`${field} for holding ${holding.id}`} type={field === "weight" ? "number" : "text"} step="any" value={holding[field]} onChange={(event) => updatePosition({ holdings: selected.holdings.map((row) => row.id === holding.id ? { ...row, [field]: event.target.value } : row) })} /></td>)}
            <td className="p-2"><button type="button" className={button} aria-label={`Remove holding ${holding.id}`} title="Remove holding" onClick={() => updatePosition({ holdings: selected.holdings.filter((row) => row.id !== holding.id) })}>X</button></td>
          </tr>)}</tbody>
        </table></div>
        <div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={() => { updatePosition({ holdings: [...selected.holdings, { id: nextId, instrument: "", issuer: "", currency: "", family: "", weight: selected.kind === "direct" ? "100" : "0" }] }); setNextId(nextId + 1); }}>Add holding</button>
          <button type="button" className={button} onClick={() => { const remaining = positions.filter((position) => position.id !== selectedId); setPositions(remaining); setSelectedId(remaining[0]?.id ?? -1); }}>Remove position</button></div>
      </> : <p className="text-sm text-foreground-muted">No positions. Add a position to begin.</p>}
      <p className="text-xs leading-6 text-foreground-muted">Portfolio allocations must total 100%. Fund holdings may total less than 100%; the remainder stays unknown. Direct positions need one holding at 100%. Use consistent instrument and legal issuer names across sources; currency means economic exposure, not subscription currency.</p>
      {calculation.error ? <p role="alert" className="text-sm text-rose-300">{calculation.error}</p> : null}
      {calculation.result ? <>
        <dl className="grid gap-4 sm:grid-cols-3">{[["Disclosed portfolio exposure", pct(calculation.result.knownWeight)], ["Unknown exposure", pct(calculation.result.unknownWeight)], ["Largest disclosed issuer", calculation.result.issuers[0] ? `${calculation.result.issuers[0].name} (${pct(calculation.result.issuers[0].weight)})` : "None"]].map(([label, value]) => <div key={label} className="min-w-0 border-t border-white/15 pt-3"><dt className="text-xs text-foreground-muted">{label}</dt><dd className="mt-2 break-words font-semibold text-foreground">{value}</dd></div>)}</dl>
        {calculation.result.warnings.length ? <ul className="space-y-2 text-sm text-amber-200">{calculation.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
        <div className="grid gap-6 lg:grid-cols-2"><ExposureTable title="Instrument exposure" rows={calculation.result.instruments} positions={positions} /><ExposureTable title="Issuer exposure" rows={calculation.result.issuers} positions={positions} /><ExposureTable title="Currency exposure" rows={calculation.result.currencies} positions={positions} /><ExposureTable title="Instrument families" rows={calculation.result.families} positions={positions} /><ExposureTable title="Overlapping instruments" rows={calculation.result.instrumentOverlap} positions={positions} /><ExposureTable title="Overlapping issuers" rows={calculation.result.issuerOverlap} positions={positions} /></div>
      </> : null}
      <p className="text-xs leading-6 text-foreground-muted">Exposures equal portfolio allocation times disclosed holding weight. Unknown exposure is excluded from category tables. One-level analysis only: nested funds require manually expanded holdings. No PDF extraction, price-series substitution, VaR recalculation or suitability recommendation.</p>
    </div>
  );
}

function ExposureTable({ title, rows, positions }: { title: string; rows: ExposureRow[]; positions: PositionForm[] }) {
  return <div className="min-w-0 overflow-x-auto"><table className="w-full text-left text-sm text-foreground"><caption className="pb-3 text-left font-semibold">{title}</caption><thead><tr><th className="p-2">Exposure</th><th className="p-2">Portfolio %</th><th className="p-2">Sources</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.name} className="border-t border-white/10"><td className="p-2 break-words">{row.name}</td><td className="p-2 whitespace-nowrap">{pct(row.weight)}</td><td className="p-2 break-words">{row.sources.map((id) => positions.find((position) => String(position.id) === id)?.name ?? id).join(", ")}</td></tr>) : <tr><td colSpan={3} className="p-2 text-foreground-muted">No disclosed exposure.</td></tr>}</tbody></table></div>;
}
