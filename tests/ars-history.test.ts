import test from "node:test";
import assert from "node:assert/strict";
import { importArsHistory } from "@/lib/market-data/ars-history";
import { parseTickerInput } from "@/lib/market-data/request";
const csv = "date,ticker,close,currency,source\n2026-10-01,SPY,100,ARS,broker\n2026-10-02,SPY,110,ARS,broker\n2026-10-01,BCMMA,10,ARS,factsheet\n2026-10-02,BCMMA,10.1,ARS,factsheet\n";
test("ARS history computes local returns including a fund without substitution", () => {
 const result = importArsHistory(csv, ["SPY", "BCMMA"], "6M");
 assert.equal(result.meta.priceCurrency, "ARS");
 assert.equal(result.meta.observations, 2);
 assert.ok(Math.abs(result.metrics[0].totalReturn - 0.1) < 1e-10);
 assert.ok(Math.abs(result.metrics[1].totalReturn - 0.01) < 1e-10);
});
test("rejects mixed currencies, missing fund, duplicates and invalid dates", () => {
 assert.throws(() => importArsHistory(csv.replace("110,ARS", "110,USD"), ["SPY", "BCMMA"], "6M"), /ARS/);
 assert.throws(() => importArsHistory(csv, ["SPY", "BCMMA", "COIN"], "6M"), /Missing/);
 assert.throws(() => importArsHistory(csv + "2026-10-02,SPY,120,ARS,broker\n", ["SPY", "BCMMA"], "6M"), /Duplicate/);
 assert.throws(() => importArsHistory(csv.replaceAll("2026-10-01", "2026-02-30"), ["SPY", "BCMMA"], "6M"), /date/);
});
test("aligns actual common dates and requires overlapping observations", () => {
 assert.throws(() => importArsHistory(csv.replace("2026-10-01,BCMMA", "2026-09-30,BCMMA"), ["SPY", "BCMMA"], "6M"), /overlapping/);
});
test("ticker limit accepts 30 and rejects 31", () => {
 const tickers = Array.from({length:30},(_,i)=>`T${i}`);
 assert.equal(parseTickerInput(tickers.join(",")).tickers?.length,30);
 assert.match(parseTickerInput([...tickers,"EXTRA"].join(",")).error!, /30/);
});
