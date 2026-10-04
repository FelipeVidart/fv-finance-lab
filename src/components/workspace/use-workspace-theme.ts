"use client";

import { useSyncExternalStore } from "react";

export type WorkspaceTheme = "light" | "dark";
export const WORKSPACE_THEME_COOKIE = "fv-workspace-theme";
const changeEvent = "fv-workspace-theme-change";
let memoryTheme: WorkspaceTheme | null = null;

function readTheme(): WorkspaceTheme {
  if (memoryTheme) return memoryTheme;
  const cookie = document.cookie.split("; ").find(value => value.startsWith(`${WORKSPACE_THEME_COOKIE}=`));
  return cookie?.split("=")[1] === "dark" ? "dark" : "light";
}

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  return () => window.removeEventListener(changeEvent, listener);
}

export function useWorkspaceTheme(initialTheme: WorkspaceTheme) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => initialTheme);
  function setTheme(nextTheme: WorkspaceTheme) {
    memoryTheme = nextTheme;
    document.cookie = `${WORKSPACE_THEME_COOKIE}=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    window.dispatchEvent(new Event(changeEvent));
  }
  return [theme, setTheme] as const;
}
