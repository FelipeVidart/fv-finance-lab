import test from 'node:test';
import assert from 'node:assert/strict';
import {riskPieRows,pieSlices} from '@/lib/workspace/risk-pie';
import {buildFactorGradVarAnalysis} from '@/lib/finance/risk/factor-gradvar';
import type {MarketDataExplorerPayload} from '@/lib/market-data/types';
test('negative risk stays signed in detail and never becomes a positive pie slice',()=>{
 const rows=[{ticker:'A',value:1.2},{ticker:'B',value:-.2}];const p=riskPieRows(rows);
 assert.equal(p.partial,true);assert.equal(p.rows[0].value,1);assert.equal(p.rows[1].value,0);assert.equal(p.negative[0].value,-.2);assert.equal(pieSlices(p.rows,0,0,10)[0].full,true);
 assert.equal(riskPieRows([{ticker:'A',value:0}]).available,false);
 assert.throws(()=>riskPieRows([{ticker:'A',value:NaN}]));
});
test('OLS recovers known exposure and rejects returns with mismatched starting dates',()=>{
 let factor=100,asset=100;const returns:number[]=[];
 const dates=Array.from({length:41},(_,i)=>new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10));
 const points=dates.map((date,i)=>{if(i){const r=.01*Math.sin(i);factor*=1+r;asset*=1+2*r;returns.push(2*r);}return {date,prices:{A:asset,F:factor},normalized:{A:asset,F:factor},cumulativeReturns:{A:asset/100-1,F:factor/100-1},drawdowns:{A:0,F:0}};});
 const data:MarketDataExplorerPayload={tickers:['A'],period:'6M',points,metrics:[],meta:{provider:'Test',interval:'1day',adjustMode:'all',observations:41,commonStartDate:dates[0],commonEndDate:dates.at(-1)!}};
 const definitions=[{id:'f',name:'Factor',proxyTicker:'F',description:'Test'}];
 const input={assetData:data,factorData:{...data,tickers:['F']},tickers:['A'],weights:{A:1},portfolioDailyReturns:returns,factorDefinitions:definitions};
 const exact=buildFactorGradVarAnalysis(input);
 assert.equal(exact.observations,40);assert.ok(Math.abs(exact.portfolioRegression!.betas.f-2)<1e-8);assert.ok(Math.abs(exact.portfolioRegression!.rSquared!-1)<1e-8);
 const missing=buildFactorGradVarAnalysis({...input,factorData:{...input.factorData,points:points.filter((_,i)=>i!==10)}});
 assert.equal(missing.observations,38);assert.ok(Math.abs(missing.portfolioRegression!.betas.f-2)<1e-8);
 assert.ok(Math.abs(missing.factorAttribution.reduce((s,r)=>s+r.contributionShare,0)-1)<1e-10);
});
