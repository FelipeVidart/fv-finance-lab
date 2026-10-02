export type FundHolding = {
  instrument: string;
  issuer: string;
  currency: string;
  family: string;
  weight: number;
};
export type LookThroughPosition = {
  id: string;
  name: string;
  kind: "fund" | "direct";
  weight: number;
  asOf: string;
  source: string;
  holdings: FundHolding[];
};
export type ExposureRow = { name: string; weight: number; sources: string[] };

export function analyzeFundLookThrough(positions: LookThroughPosition[], analysisDate: string) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(analysisDate)) throw new Error("Enter a valid analysis date.");
  if (!positions.length) throw new Error("Add at least one position.");
  if (new Set(positions.map((position) => position.id)).size !== positions.length) {
    throw new Error("Position IDs must be unique.");
  }
  const totalWeight = positions.reduce((sum, position) => sum + position.weight, 0);
  if (!Number.isFinite(totalWeight) || Math.abs(totalWeight - 1) > 1e-8) {
    throw new Error("Portfolio allocations must total 100%.");
  }
  const maps = { instrument: new Map<string, ExposureRow>(), issuer: new Map<string, ExposureRow>(),
    currency: new Map<string, ExposureRow>(), family: new Map<string, ExposureRow>() };
  const warnings: string[] = [];
  let unknownWeight = 0;
  const coverage = positions.map((position) => {
    if (!position.id.trim() || !position.name.trim() || !position.source.trim() ||
        !Number.isFinite(position.weight) || position.weight < 0 || position.weight > 1 ||
        !validDate(position.asOf) || position.asOf > analysisDate) {
      throw new Error("Each position needs a name, source, valid snapshot date and allocation between 0% and 100%.");
    }
    if (position.kind !== "fund" && position.kind !== "direct") throw new Error("Invalid position type.");
    if (position.kind === "direct" && (position.holdings.length !== 1 || position.holdings[0].weight !== 1)) {
      throw new Error("Direct positions must contain exactly one holding at 100%.");
    }
    const disclosedWeight = position.holdings.reduce((sum, holding) => sum + holding.weight, 0);
    if (!Number.isFinite(disclosedWeight) || disclosedWeight > 1 + 1e-8) {
      throw new Error(`${position.name}: holdings cannot exceed 100%.`);
    }
    for (const holding of position.holdings) {
      if (!Number.isFinite(holding.weight) || holding.weight < 0 || holding.weight > 1 ||
          [holding.instrument, holding.issuer, holding.currency, holding.family].some((value) => !value.trim())) {
        throw new Error(`${position.name}: complete holding classifications and use nonnegative weights.`);
      }
      if (holding.weight === 0 || position.weight === 0) continue;
      for (const field of ["instrument", "issuer", "currency", "family"] as const) {
        const name = holding[field].trim().replace(/\s+/g, " ").toUpperCase();
        const row = maps[field].get(name) ?? { name, weight: 0, sources: [] };
        row.weight += position.weight * holding.weight;
        if (!row.sources.includes(position.id)) row.sources.push(position.id);
        maps[field].set(name, row);
      }
    }
    const undisclosed = Math.max(0, 1 - disclosedWeight);
    unknownWeight += position.weight * undisclosed;
    const ageDays = Math.round((Date.parse(analysisDate) - Date.parse(position.asOf)) / 86400000);
    if (position.weight > 0 && undisclosed > 1e-8) warnings.push(`${position.name}: ${(undisclosed * 100).toFixed(2)}% of holdings undisclosed.`);
    if (position.weight > 0 && ageDays > 90) warnings.push(`${position.name}: snapshot is ${ageDays} days old (review threshold: 90 days).`);
    return { id: position.id, name: position.name, disclosedWeight, ageDays };
  });
  const rows = (map: Map<string, ExposureRow>) => [...map.values()].sort((a, b) => b.weight - a.weight);
  const instruments = rows(maps.instrument);
  const issuers = rows(maps.issuer);
  return { coverage, unknownWeight, knownWeight: 1 - unknownWeight,
    instruments, issuers, currencies: rows(maps.currency), families: rows(maps.family),
    instrumentOverlap: instruments.filter((row) => row.sources.length > 1),
    issuerOverlap: issuers.filter((row) => row.sources.length > 1), warnings };
}
