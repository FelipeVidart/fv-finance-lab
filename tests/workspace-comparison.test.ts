import test from 'node:test';
import assert from 'node:assert/strict';
import { compareWorkspacePortfolio } from '@/lib/finance/risk/workspace-comparison';
import { previewCSVHistory } from '@/lib/workspace/history-preview';
import { EMPTY_DRAFT, importPositionsCSV } from '@/lib/workspace/portfolio-draft';
import { buildChartBundle } from '@/lib/workspace/export/chart-bundle';
import { renderReportPages } from '@/lib/workspace/export/report-pages';
import { applyHistoryPreview } from '@/lib/workspace/history-preview';
const draft={...EMPTY_DRAFT,positions:importPositionsCSV('ticker,value,kind\nSPY,50,investment\nEFA,50,investment')};
const preview=previewCSVHistory('date,ticker,close,currency,source\n2026-01-01,SPY,100,ARS,Test\n2026-01-01,EFA,100,ARS,Test\n2026-01-02,SPY,90,ARS,Test\n2026-01-02,EFA,110,ARS,Test\n2026-01-03,SPY,99,ARS,Test\n2026-01-03,EFA,99,ARS,Test',draft);
test('proposals keep shared dates and support zero weights without altering source data',()=>{
 const original=JSON.stringify(preview.data);
 const same=compareWorkspacePortfolio(preview.data,{SPY:'50',EFA:'50'},1000);
 assert.ok(Math.abs(same.portfolio.dailyReturns[0])<1e-12);
 const changed=compareWorkspacePortfolio(preview.data,{SPY:'100',EFA:'0'},1000);
 assert.ok(Math.abs(changed.portfolio.dailyReturns[0]+.1)<1e-12);
 assert.deepEqual(changed.portfolio.points.map(p=>p.date),same.portfolio.points.map(p=>p.date));
 assert.equal(JSON.stringify(preview.data),original);
 for(const values of ([{SPY:'50',EFA:'40'},{SPY:'-1',EFA:'101'},{SPY:'NaN',EFA:'100'},{SPY:'100',OTHER:'0'}] as Record<string,string>[])) assert.throws(()=>compareWorkspacePortfolio(preview.data,values,1000));
});
test('comparison report retains current data and adds two pages with short-sample masking',()=>{
 const a=applyHistoryPreview(draft,preview,true), r=compareWorkspacePortfolio(preview.data,{SPY:'50',EFA:'50'},1000);
 const b=buildChartBundle({...a,preview,portfolio:r.portfolio},draft,r.risk);
 const p=compareWorkspacePortfolio(preview.data,{SPY:'100',EFA:'0'},1000), pb=buildChartBundle({...a,preview,portfolio:p.portfolio,weights:p.weights},draft,p.risk);
 b.comparison={metrics:pb.metrics,weights:preview.data.tickers.map(t=>({ticker:t,current:.5,proposed:p.weights[t],currentRisk:0,proposedRisk:1})),evolution:pb.charts[2].points!,riskAvailable:true};
 const pages=renderReportPages(b,{title:'Test',comment:''},'Test');
 assert.equal(pages.length,8);assert.ok(pages[5].svg.includes('No es una proyección'));assert.ok(pages[5].svg.includes('N/D'));
 assert.ok(pages[6].svg.includes('50% / 0%'));assert.ok(!pages.some(p=>/NaN|Infinity/.test(p.svg)));
});
