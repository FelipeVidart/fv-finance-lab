"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { encodeSavedAnalyses, MAX_SAVED_ANALYSES, parseSavedAnalyses } from "@/lib/analysis-snapshots";

const eventName = "fv-saved-analyses-changed";
const unavailable = "__storage_unavailable__";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(eventName, listener); };
}
const serverSnapshot = () => null;
const control = "min-w-0 rounded-lg border border-white/15 bg-background-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";
const button = "rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground disabled:opacity-40";

export function SavedAnalysisControls<T>({ storageKey, data, validate, onLoad }: {
  storageKey: string;
  data: T;
  validate: (value: unknown) => value is T;
  onLoad: (value: T) => void;
}) {
  const raw = useSyncExternalStore(subscribe, () => {
    try { return window.localStorage.getItem(storageKey); }
    catch { return unavailable; }
  }, serverSnapshot);
  const parsed = useMemo(() => {
    try {
      if (raw === unavailable) throw new Error("Browser storage is unavailable.");
      return { analyses: parseSavedAnalyses(raw, validate), error: null };
    } catch (error) {
      return { analyses: [], error: error instanceof Error ? error.message : "Unable to read saved analyses." };
    }
  }, [raw, validate]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const selected = parsed.analyses.find((analysis) => analysis.id === selectedId);

  function perform(action: () => void) {
    setActionError(null); setMessage("");
    try { action(); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Unable to save. Browser storage may be full or blocked."); }
  }
  function write(analyses: typeof parsed.analyses) {
    window.localStorage.setItem(storageKey, encodeSavedAnalyses(analyses, validate));
    window.dispatchEvent(new Event(eventName));
  }
  function save() {
    perform(() => {
      if (!name.trim()) throw new Error("Enter an analysis name.");
      const current = parseSavedAnalyses(window.localStorage.getItem(storageKey), validate);
      if (current.length >= MAX_SAVED_ANALYSES) throw new Error("Saved analysis limit reached. Delete an existing analysis first.");
      const analysis = { id: crypto.randomUUID(), name: name.trim(), savedAt: new Date().toISOString(), data };
      write([analysis, ...current]);
      setSelectedId(analysis.id); setMessage("Analysis saved in this browser.");
    });
  }
  return (
    <section aria-label="Saved analyses" className="space-y-3 border-y border-white/15 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-foreground">Analysis name<input className={control} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <button type="button" className={button} disabled={Boolean(parsed.error)} onClick={save}>Save new analysis</button>
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-foreground">Saved analyses<select className={control} value={selected?.id ?? ""} onChange={(event) => { setSelectedId(event.target.value); setMessage(""); setActionError(null); }}><option value="">Select an analysis</option>{parsed.analyses.map((analysis) => <option key={analysis.id} value={analysis.id}>{analysis.name} ({analysis.savedAt.slice(0, 10)})</option>)}</select></label>
        <button type="button" className={button} disabled={!selected} onClick={() => perform(() => { if (selected) { onLoad(structuredClone(selected.data)); setName(selected.name); setMessage("Analysis loaded; results recalculated."); } })}>Load</button>
        <button type="button" className={button} disabled={!selected} onClick={() => perform(() => { const current = parseSavedAnalyses(window.localStorage.getItem(storageKey), validate); write(current.filter((analysis) => analysis.id !== selectedId)); setSelectedId(""); setMessage("Saved analysis deleted; current inputs retained."); })}>Delete saved</button>
      </div>
      <p className="text-xs text-foreground-muted">Saved in this browser only. Loading replaces current inputs; unsaved edits are not recovered after reload.</p>
      {message ? <p role="status" className="text-sm text-emerald-300">{message}</p> : null}
      {parsed.error || actionError ? <p role="alert" className="text-sm text-rose-300">{parsed.error ?? actionError}</p> : null}
    </section>
  );
}
