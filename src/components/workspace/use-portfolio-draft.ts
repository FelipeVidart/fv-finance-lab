"use client";
import { useSyncExternalStore } from "react";
import { decodePortfolioDraft, EMPTY_DRAFT, WORKSPACE_DRAFT_KEY, type PortfolioDraft } from "@/lib/workspace/portfolio-draft";

type DraftState = { draft: PortfolioDraft; ready: boolean; storageWarning: string };
const serverState: DraftState = { draft: EMPTY_DRAFT, ready: false, storageWarning: "" };
let clientState: DraftState | null = null;
const eventName = "fv-workspace-draft-change";

function snapshot(): DraftState {
  if (clientState) return clientState;
  try {
    const raw = localStorage.getItem(WORKSPACE_DRAFT_KEY);
    clientState = { draft: raw ? decodePortfolioDraft(raw) : EMPTY_DRAFT, ready: true, storageWarning: "" };
  } catch {
    clientState = { draft: EMPTY_DRAFT, ready: true, storageWarning: "No se pudo recuperar la cartera guardada. Podés trabajar aquí; no se reemplazará el guardado anterior." };
  }
  return clientState;
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
function saveDraft(draft: PortfolioDraft) {
  let storageWarning = snapshot().storageWarning;
  if (!storageWarning) {
    try { localStorage.setItem(WORKSPACE_DRAFT_KEY, JSON.stringify({ version: 1, draft })); }
    catch { storageWarning = "El navegador no permite guardar la cartera. Podés continuar sin guardado automático."; }
  }
  clientState = { draft, ready: true, storageWarning };
  window.dispatchEvent(new Event(eventName));
}
export function usePortfolioDraft() {
  const state = useSyncExternalStore(subscribe, snapshot, () => serverState);
  return { ...state, setDraft: saveDraft };
}
