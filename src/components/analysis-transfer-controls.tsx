"use client";

import { useState } from "react";
import { decodeAnalysisFile, encodeAnalysisFile, FUND_CSV_TEMPLATE, type AnalysisKind } from "@/lib/analysis-transfer";

const button = "rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground";

function download(text: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AnalysisTransferControls<T>({ kind, data, validate, onLoad, importCSV }: {
  kind: AnalysisKind;
  data: T;
  validate: (value: unknown) => value is T;
  onLoad: (data: T) => void;
  importCSV?: (raw: string) => T;
}) {
  const [pending, setPending] = useState<{ data: T; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isReading, setIsReading] = useState(false);
  async function readFile(file: File) {
    setError(null); setPending(null); setMessage(""); setIsReading(true);
    try {
      if (file.size > 5_000_000) throw new Error("File exceeds the 5 MB size limit.");
      const raw = await file.text();
      const imported = file.name.toLowerCase().endsWith(".csv") && importCSV ? importCSV(raw) : decodeAnalysisFile(raw, kind, validate);
      setPending({ data: imported, filename: file.name });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to import file."); }
    finally { setIsReading(false); }
  }
  return <section aria-label="Import and export analysis" className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={button} onClick={() => {
        setError(null); setMessage("");
        try { download(encodeAnalysisFile(kind, data, validate), `fv-${kind}-analysis.json`, "application/json"); setMessage("Analysis file exported."); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to export."); }
      }}>Export analysis JSON</button>
      <label className="min-w-0 text-sm text-foreground">Import {importCSV ? "JSON / CSV" : "JSON"}
        <input aria-label={`Import ${kind} analysis file`} type="file" accept={importCSV ? ".json,.csv" : ".json"} disabled={isReading} className="ml-2 max-w-full text-xs" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void readFile(file); }} />
      </label>
      {importCSV ? <button type="button" className={button} onClick={() => download(FUND_CSV_TEMPLATE, "fv-fund-holdings-template.csv", "text/csv;charset=utf-8")}>Download CSV template</button> : null}
    </div>
    {isReading ? <p role="status" className="text-sm text-foreground-muted">Reading file...</p> : null}
    {pending ? <div className="space-y-3 rounded-lg border border-white/15 p-3">
      <p className="break-words text-sm text-foreground">Validated file: {pending.filename}. Applying replaces current inputs; saved analyses remain unchanged.</p>
      <details><summary className="cursor-pointer text-sm text-foreground-muted">Preview imported inputs</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground-muted">{JSON.stringify(pending.data, null, 2)}</pre></details>
      <div className="flex gap-3"><button type="button" className={button} onClick={() => { onLoad(pending.data); setPending(null); setMessage("Imported inputs applied. Save this analysis to retain it in this browser."); }}>Apply import</button><button type="button" className={button} onClick={() => setPending(null)}>Cancel</button></div>
    </div> : null}
    <p className="text-xs leading-6 text-foreground-muted">JSON preserves drafts. {importCSV ? "CSV uses the template column order, comma separators and decimal points. Repeated position IDs identify one allocation; holding weights are percentages within that position. CSV must pass portfolio validation." : "Import a bond analysis exported by this app."}</p>
    {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
    {message ? <p role="status" className="text-sm text-emerald-300">{message}</p> : null}
  </section>;
}
