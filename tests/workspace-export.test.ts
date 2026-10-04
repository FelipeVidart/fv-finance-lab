import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { buildPortfolioRiskAnalysis } from "@/lib/finance/risk/portfolio-risk-analysis";
import { applyHistoryPreview, previewCSVHistory } from "@/lib/workspace/history-preview";
import { EMPTY_DRAFT, importPositionsCSV } from "@/lib/workspace/portfolio-draft";
import { buildChartBundle, exportNotes, exportStem, type ChartBundle } from "@/lib/workspace/export/chart-bundle";
import { renderChartSvg } from "@/lib/workspace/export/chart-svg";
import { crc32, createZip } from "@/lib/workspace/export/zip";

function bundle(): ChartBundle {
  const draft = { ...EMPTY_DRAFT, name: 'Cliente <script> & "prueba" / Ñ', positions: importPositionsCSV('ticker,value,kind\nSPY,75,investment\nEFA,25,investment\nBCMMA,10,money-market') };
  const preview = previewCSVHistory('date,ticker,close,currency,source\n2026-01-01,SPY,100,ARS,Test & <source>\n2026-01-02,SPY,110,ARS,Test & <source>\n2026-01-03,SPY,99,ARS,Test & <source>', draft);
  const allocation = applyHistoryPreview(draft, preview, true);
  const portfolio = buildPortfolioAnalytics({ data: preview.data, weights: allocation.weights });
  const risk = buildPortfolioRiskAnalysis({ data: preview.data, tickers: portfolio.tickers, weights: allocation.weights, portfolioDailyReturns: portfolio.dailyReturns, portfolioNavPoints: portfolio.points });
  return buildChartBundle({ ...allocation, portfolio, preview }, draft, risk);
}
test('exports keep applied weights, coverage, exclusions and entire dated series', () => {
  const b = bundle();
  assert.equal(b.coverage, .75); assert.deepEqual(b.excluded, ['BCMMA', 'EFA']);
  assert.deepEqual(b.charts[0].rows, [{ ticker: 'SPY', value: 1 }]);
  assert.equal(b.charts[2].points!.length, 3);
  assert.ok(Math.abs(b.charts[2].points!.at(-1)!.value - 99) < 1e-8);
  assert.ok(Math.abs(b.charts[3].points!.at(-1)!.value + .1) < 1e-8);
  assert.ok(exportNotes(b, 'Test').join('\n').includes('MUESTRA PARCIAL: cobertura 75%'));
  assert.match(exportStem(b), /^[a-z0-9-]+$/);
});
test('SVG encodes untrusted text and retains all 30 asset labels without clipping', () => {
  const b = bundle(); const chart = { ...b.charts[0], rows: Array.from({length:30}, (_,i) => ({ ticker: `T${i}`, value: 1 / 30 })) };
  const result = renderChartSvg(b, chart, '2026-10-04');
  assert.ok(result.svg.includes('&lt;script&gt;')); assert.ok(!result.svg.includes('<script>'));
  assert.ok(result.svg.includes('Test &amp; &lt;source&gt;'));
  assert.ok(result.svg.includes('>T29</text>')); assert.ok(result.height > 1800);
  assert.ok(result.svg.includes('width="1600"')); assert.ok(!/NaN|Infinity/.test(result.svg));
});
test('flat risk exports state unavailability and signed risk shares remain negative', () => {
  const b = bundle();
  const unavailable = renderChartSvg(b, { ...b.charts[1], available: false }, 'Test');
  assert.ok(unavailable.svg.includes('Sin variación observada'));
  const signed = renderChartSvg(b, { ...b.charts[1], rows:[{ticker:'A',value:1.2},{ticker:'B',value:-.2}] }, 'Test');
  assert.ok(signed.svg.includes('>-20%</text>')); assert.ok(signed.svg.includes('fill="#b95247"'));
  assert.ok(!/NaN|Infinity/.test(signed.svg));
});
test('ZIP round trips UTF-8 filenames and binary PNG bytes through an independent reader', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const png = new Uint8Array([137,80,78,71,13,10,26,10,0,255]);
  const zip = createZip([{ name:'composición.png', data:png }, {name:'datos.txt',data:new TextEncoder().encode('Moneda: ARS · prueba')}]);
  const result = spawnSync('python3', ['-c', 'import sys,io,zipfile,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; print(json.dumps({n:list(z.read(n)) for n in z.namelist()}))'], {input:zip});
  assert.equal(result.status, 0, result.stderr.toString());
  const decoded = JSON.parse(result.stdout.toString()); assert.deepEqual(decoded['composición.png'], [...png]);
  assert.equal(new TextDecoder().decode(new Uint8Array(decoded['datos.txt'])), 'Moneda: ARS · prueba');
  assert.throws(() => createZip([{name:'../bad',data:png}]));
  assert.throws(() => createZip([{name:'a',data:png},{name:'a',data:png}]));
});
