import { mkdir, writeFile } from "node:fs/promises";

const START = "2021-10-06";
const END = "2026-10-07";
const ACTUAL = ["SPY","RSP","EFA","IBIT","AMZN","GOOGL","NU","MELI","EWZ"];
const FETCH = [...new Set([...ACTUAL,"BTC-USD","PAGS","STNE"])];
const toUnix = (s, add=0) => Math.floor((new Date(s+"T00:00:00Z").getTime()+add*86400000)/1000);

async function yahoo(symbol) {
  const url = new URL("https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol));
  url.searchParams.set("period1", String(toUnix(START)));
  url.searchParams.set("period2", String(toUnix(END, 1)));
  url.searchParams.set("interval","1d");
  url.searchParams.set("events","history");
  url.searchParams.set("includeAdjustedClose","true");
  const res = await fetch(url, { headers: { "User-Agent":"Mozilla/5.0", "Accept":"application/json" } });
  if (!res.ok) throw new Error(symbol+" HTTP "+res.status);
  const j = await res.json();
  const r = j.chart?.result?.[0];
  if (!r) throw new Error(symbol+" no result");
  const ts = r.timestamp ?? [];
  const close = r.indicators?.quote?.[0]?.close ?? [];
  const adj = r.indicators?.adjclose?.[0]?.adjclose ?? [];
  const pts = [];
  for (let i=0;i<ts.length;i++) {
    const v = Number.isFinite(adj[i]) && adj[i] > 0 ? adj[i] : close[i];
    if (!Number.isFinite(v) || v <= 0) continue;
    pts.push({date:new Date(ts[i]*1000).toISOString().slice(0,10), close:v});
  }
  return {currency:r.meta?.currency, points:pts};
}

function map(points){ return new Map(points.map(p=>[p.date,p.close])); }

function stitch(actual, proxy) {
  const a = [...actual].sort((x,y)=>x.date.localeCompare(y.date));
  const p = [...proxy].sort((x,y)=>x.date.localeCompare(y.date));
  if (!a.length || !p.length) throw new Error("missing series for stitch");
  const first = a[0];
  const pm = map(p);
  let proxyAtFirst = pm.get(first.date);
  if (!proxyAtFirst) {
    const prev = p.filter(x=>x.date<=first.date).at(-1);
    if (!prev) throw new Error("no proxy anchor");
    proxyAtFirst = prev.close;
  }
  const scale = first.close / proxyAtFirst;
  const pre = p.filter(x=>x.date<first.date).map(x=>({date:x.date,close:x.close*scale}));
  return [...pre, ...a];
}

function csv(seriesByTicker, sourceLabel) {
  const rows = ["date,ticker,close,currency,source"];
  for (const ticker of Object.keys(seriesByTicker)) {
    for (const p of seriesByTicker[ticker]) {
      rows.push([p.date,ticker,p.close.toFixed(8),"USD",sourceLabel].join(","));
    }
  }
  return rows.join("\n")+"\n";
}

const data = {};
for (const s of FETCH) {
  console.log("fetch",s);
  data[s] = await yahoo(s);
  console.log(s, data[s].currency, data[s].points.length, data[s].points[0]?.date, data[s].points.at(-1)?.date);
}
for (const s of FETCH) if (data[s].currency !== "USD") throw new Error(s+" currency "+data[s].currency);

const common = {
  SPY:data.SPY.points, RSP:data.RSP.points, EFA:data.EFA.points,
  AMZN:data.AMZN.points, GOOGL:data.GOOGL.points, MELI:data.MELI.points, EWZ:data.EWZ.points,
  IBIT:stitch(data.IBIT.points, data["BTC-USD"].points),
};
const primary = {...common, NU:stitch(data.NU.points, data.PAGS.points)};
const sensitivity = {...common, NU:stitch(data.NU.points, data.STNE.points)};

await mkdir("tmp-history",{recursive:true});
await writeFile("tmp-history/WM-V2VG-R3NR_historico_5Y_proxy_PAGS.csv", csv(primary,"Yahoo; IBIT prelaunch=BTC-USD chained; NU pre-IPO=PAGS chained"));
await writeFile("tmp-history/WM-V2VG-R3NR_historico_5Y_proxy_STNE.csv", csv(sensitivity,"Yahoo; IBIT prelaunch=BTC-USD chained; NU pre-IPO=STNE chained"));
await writeFile("tmp-history/README.txt", [
  "Histórico proxy para app de riesgo.",
  "IBIT: serie real desde su inicio; antes, BTC-USD reescalado al primer precio real de IBIT.",
  "NU: serie real desde IPO; antes, PAGS (principal) o STNE (sensibilidad), reescalado al primer precio real de NU.",
  "Otros tickers: Yahoo adjusted close real.",
  "Ventana solicitada: "+START+" a "+END+".",
  "Importar con moneda USD."
].join("\n"));
console.log("done");
