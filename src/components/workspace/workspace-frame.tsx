"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useWorkspaceTheme, type WorkspaceTheme } from "./use-workspace-theme";
import styles from "./workspace.module.css";

export function WorkspaceFrame({ children, initialTheme }: { children: ReactNode; initialTheme: WorkspaceTheme }) {
  const [theme, setTheme] = useWorkspaceTheme(initialTheme);
  return <div className={styles.workspace} data-theme={theme}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span className={styles.monogram}>FV</span><span><strong>Finance Lab</strong><small>Espacio de trabajo</small></span></Link>
      <div className={styles.headerActions}><div className={styles.themeSwitch} role="group" aria-label="Apariencia"><button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Claro</button><button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Oscuro</button></div><Link href="/tools" className={styles.labLink}>Ir al laboratorio ↗</Link></div>
    </header>
    <div className={styles.content}>{children}<footer className={styles.footer}><span>FV Finance Lab · Herramientas para tu trabajo</span><Link href="/workspace/design">Ver propuesta de diseño</Link></footer></div>
  </div>;
}
