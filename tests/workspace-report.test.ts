import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createImagePdf } from "@/lib/workspace/export/image-pdf";
import { renderReportPages, wrapReportText } from "@/lib/workspace/export/report-pages";
import { buildChartBundle } from "@/lib/workspace/export/chart-bundle";
import { EMPTY_DRAFT, importPositionsCSV } from "@/lib/workspace/portfolio-draft";
import { applyHistoryPreview, previewCSVHistory } from "@/lib/workspace/history-preview";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { buildPortfolioRiskAnalysis } from "@/lib/finance/risk/portfolio-risk-analysis";
function fixture() {
 const draft = {...EMPTY_DRAFT, name:'Prueba',positions:importPositionsCSV('ticker,value,kind\nSPY,75,investment\nEFA,25,investment\nBCMMA,50,money-market')};
 const preview = previewCSVHistory('date,ticker,close,currency,source\n2026-01-01,SPY,100,ARS,Test\n2026-01-02,SPY,110,ARS,Test\n2026-01-03,SPY,99,ARS,Test', draft);
 const allocation=applyHistoryPreview(draft,preview,true);
 const portfolio=buildPortfolioAnalytics({data:preview.data,weights:allocation.weights});
 const risk=buildPortfolioRiskAnalysis({data:preview.data,tickers:portfolio.tickers,weights:allocation.weights,portfolioDailyReturns:portfolio.dailyReturns,portfolioNavPoints:portfolio.points});
 return buildChartBundle({...allocation,portfolio,preview},draft,risk);
}
test('report uses applied metrics and preserves partial sample, comment and source', () => {
 const b=fixture(), pages=renderReportPages(b,{title:'Ñ & <script>',comment:'Revisar concentración.'},'2026-10-04');
 assert.equal(pages.length,7); assert.equal(b.coverage,.75);
 const all=pages.map(p=>p.svg).join('\n');
 assert.ok(all.includes('Cobertura 75%')); assert.ok(all.includes('MUESTRA PARCIAL'));
 assert.ok(all.includes('Revisar concentración.')); assert.ok(all.includes('Sin histórico: EFA'));
 assert.ok(all.includes('Excluidos: BCMMA, EFA')); assert.ok(all.includes('No disponible'));
 assert.ok(all.includes('Ñ &amp; &lt;script&gt;')); assert.ok(!all.includes('<script>'));
 assert.ok(all.includes('-1%')); assert.ok(!/NaN|Infinity/.test(all));
 assert.ok(pages.at(-1)!.svg.includes('7 / 7'));
});
test('30 assets stay in page bounds and long notes create numbered continuation pages', () => {
 const b=fixture(); b.charts[0].rows=Array.from({length:30},(_,i)=>({ticker:`ASSET${i}`,value:1/30})); b.charts[1].rows=b.charts[0].rows;
 b.source='Long source '.repeat(2000);
 const pages=renderReportPages(b,{title:'W'.repeat(100),comment:'Comentario '.repeat(100)},'Test');
 assert.ok(pages.length>6); assert.ok(pages[1].svg.includes('ASSET29'));
 assert.ok(pages.some(p=>p.svg.includes('Evolución de la cartera'))); assert.ok(pages.at(-1)!.svg.includes(`${pages.length} / ${pages.length}`));
 assert.equal(wrapReportText('W'.repeat(100),74).join(''),'W'.repeat(100));
 assert.throws(()=>renderReportPages(b,{title:'a'.repeat(101),comment:''},'Test'));
 assert.throws(()=>renderReportPages(b,{title:'',comment:'a'.repeat(1201)},'Test'));
});
test('image PDF is readable by an independent parser with exact page resources', () => {
 const image=spawnSync('python3',['-c','from PIL import Image; import sys; Image.new("RGB",(2,3),"white").save(sys.stdout.buffer,format="JPEG")']);
 assert.equal(image.status,0); const jpeg=new Uint8Array(image.stdout);
 const bytes=createImagePdf(Array.from({length:4},()=>({jpeg,width:2,height:3})));
 const result=spawnSync('python3',['-c','from pypdf import PdfReader; import sys,io; r=PdfReader(io.BytesIO(sys.stdin.buffer.read()),strict=True); assert len(r.pages)==4; assert all(float(p.mediabox.width)==595 and float(p.mediabox.height)==842 for p in r.pages); assert all(p["/Resources"]["/XObject"]["/Image"]["/Width"]==2 for p in r.pages); assert all(len(p.images[0].data)>0 for p in r.pages); print("OK")'],{input:bytes});
 assert.equal(result.status,0,result.stderr.toString()); assert.equal(result.stdout.toString().trim(),'OK');
 assert.throws(()=>createImagePdf([])); assert.throws(()=>createImagePdf([{jpeg:new Uint8Array([0]),width:2,height:3}]));
});
test('diagnostics preserve constant-series unavailability, histogram counts and drawdown recovery', () => {
 const draft={...EMPTY_DRAFT,positions:importPositionsCSV('ticker,value,kind\nSPY,50,investment\nEFA,50,investment')};
 const csv='date,ticker,close,currency\n2026-01-01,SPY,100,ARS\n2026-01-01,EFA,100,ARS\n2026-01-02,SPY,80,ARS\n2026-01-02,EFA,100,ARS\n2026-01-03,SPY,100,ARS\n2026-01-03,EFA,100,ARS\n2026-01-04,SPY,90,ARS\n2026-01-04,EFA,100,ARS';
 const withSource=csv.replace('close,currency','close,currency,source').replaceAll(',ARS',',ARS,Test');
 const preview=previewCSVHistory(withSource,draft), allocation=applyHistoryPreview(draft,preview,true);
 const portfolio=buildPortfolioAnalytics({data:preview.data,weights:allocation.weights});
 const risk=buildPortfolioRiskAnalysis({data:preview.data,tickers:portfolio.tickers,weights:allocation.weights,portfolioDailyReturns:portfolio.dailyReturns,portfolioNavPoints:portfolio.points});
 const bundle=buildChartBundle({...allocation,portfolio,preview},draft,risk), d=bundle.diagnostics!;
 assert.ok(Math.abs(d.correlation[0][0]!-1)<1e-12);
 assert.equal(d.correlation[0][1],null); assert.equal(d.correlation[1][1],null);
 assert.equal(d.histogram.reduce((s,b)=>s+b.count,0),portfolio.dailyReturns.length);
 assert.equal(d.drawdowns.episodes.length,2);
 assert.equal(d.drawdowns.episodes[0].recoveryDate,'2026-01-03');
 assert.equal(d.drawdowns.episodes[0].recoveryDays,1);
 assert.equal(d.drawdowns.episodes[1].recoveryDate,null);
 assert.ok(Math.abs(bundle.dynamicVolatility![0].value-risk.ewmaVolatilitySeries[0].value*Math.sqrt(252))<1e-12);
 const svg=renderReportPages(bundle,{title:'',comment:''},'Test').map(p=>p.svg).join('');
 assert.ok(svg.includes('N/D')); assert.ok(svg.includes('Sin recuperar al cierre')); assert.ok(!/NaN|Infinity/.test(svg));
});
test('signed risk contributions are preserved instead of converted to pie shares', () => {
 const b=fixture(); b.charts[0].rows=[{ticker:'SPY',value:.8},{ticker:'GLD',value:.2}];
 b.charts[1].available=true; b.charts[1].rows=[{ticker:'SPY',value:1.2},{ticker:'GLD',value:-.2}];
 b.diagnostics=undefined;
 const pages=renderReportPages(b,{title:'',comment:''},'Test');
 assert.ok(pages[2].svg.includes('-20%')); assert.ok(pages[0].svg.includes('aportes positivos'));
 assert.ok(!pages[2].svg.includes('NaN'));
});
