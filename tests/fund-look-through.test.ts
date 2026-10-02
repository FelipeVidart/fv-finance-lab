import test from "node:test";
import assert from "node:assert/strict";
import { analyzeFundLookThrough, type LookThroughPosition } from "@/lib/finance/risk/fund-look-through";

const positions: LookThroughPosition[] = [
  { id: "fund", name: "Fund", kind: "fund", weight: 0.6, asOf: "2026-10-01", source: "Factsheet", holdings: [
    { instrument: "Bond", issuer: "Treasury", currency: "USD", family: "Sovereign", weight: 0.5 },
    { instrument: "ON", issuer: "Company", currency: "USD", family: "ON", weight: 0.3 },
  ] },
  { id: "direct", name: "Direct", kind: "direct", weight: 0.4, asOf: "2026-10-01", source: "Statement", holdings: [
    { instrument: " on ", issuer: " company ", currency: "usd", family: "ON", weight: 1 },
  ] },
];
test("look-through conserves exposure and reports unknown holdings without normalization", () => {
  const result = analyzeFundLookThrough(positions, "2026-10-02");
  assert.ok(Math.abs(result.unknownWeight - 0.12) < 1e-12);
  assert.ok(Math.abs(result.knownWeight - 0.88) < 1e-12);
  assert.ok(Math.abs(result.currencies[0].weight - 0.88) < 1e-12);
  assert.ok(Math.abs(result.issuers[0].weight - 0.58) < 1e-12);
  assert.equal(result.instrumentOverlap[0].name, "ON");
  assert.deepEqual(result.issuerOverlap[0].sources, ["fund", "direct"]);
  assert.equal(result.warnings.length, 1);
});
test("duplicate rows inside one fund do not create cross-position overlap", () => {
  const holding = positions[0].holdings[0];
  const result = analyzeFundLookThrough([{ ...positions[0], weight: 1, holdings: [{ ...holding, weight: 0.5 }, { ...holding, weight: 0.5 }] }], "2026-10-02");
  assert.equal(result.instrumentOverlap.length, 0);
  assert.equal(result.instruments[0].weight, 1);
});
test("empty fund remains fully undisclosed and stale snapshot is reported", () => {
  const result = analyzeFundLookThrough([{ ...positions[0], weight: 1, asOf: "2026-01-01", holdings: [] }], "2026-10-02");
  assert.equal(result.unknownWeight, 1);
  assert.equal(result.issuers.length, 0);
  assert.equal(result.warnings.length, 2);
});
test("invalid allocations, overweight holdings, dates and direct positions fail", () => {
  const invalid: LookThroughPosition[][] = [
    [], [{ ...positions[0], weight: 0.5 }], [{ ...positions[0], weight: NaN }],
    [{ ...positions[0], weight: 1, holdings: [{ ...positions[0].holdings[0], weight: 1.1 }] }],
    [{ ...positions[0], weight: 1, asOf: "2026-02-30" }],
    [{ ...positions[0], weight: 1, asOf: "2026-10-03" }],
    [{ ...positions[0], weight: 1, source: "" }],
    [{ ...positions[0], weight: 1, kind: "direct" }],
    [{ ...positions[0], weight: 1, holdings: [{ ...positions[0].holdings[0], weight: -0.1 }] }],
    positions.map((position) => ({ ...position, id: "same" })),
  ];
  for (const input of invalid) assert.throws(() => analyzeFundLookThrough(input, "2026-10-02"));
});
