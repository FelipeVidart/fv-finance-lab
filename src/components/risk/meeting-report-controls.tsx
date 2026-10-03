"use client";

import { useMemo, useState } from "react";
import { buildMeetingReport, renderMeetingReportHTML, renderMeetingReportMarkdown, type MeetingReportInput } from "@/lib/finance/risk/meeting-report";

export function MeetingReportControls({ input }: { input: Omit<MeetingReportInput, "title" | "note"> }) {
  const [title, setTitle] = useState("Portfolio meeting summary");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const report = useMemo(() => buildMeetingReport({ ...input, title, note }), [input, title, note]);
  function download(format: "html" | "markdown") {
    const generatedAt = new Date().toISOString();
    const content = format === "html" ? renderMeetingReportHTML(report, generatedAt) : renderMeetingReportMarkdown(report, generatedAt);
    const url = URL.createObjectURL(new Blob([content], { type: format === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `fv-portfolio-summary.${format === "html" ? "html" : "md"}`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Meeting summary exported.");
  }
  return <section aria-label="Meeting summary export" className="space-y-4 border-y border-white/15 py-5">
    <h3 className="text-lg font-semibold text-foreground">Meeting summary</h3>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm text-foreground"><span className="block">Report title</span><input className="w-full rounded-lg border border-white/15 bg-background-muted px-3 py-2" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="space-y-2 text-sm text-foreground"><span className="block">Meeting notes (optional)</span><textarea className="w-full rounded-lg border border-white/15 bg-background-muted px-3 py-2" maxLength={3000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
    </div>
    <div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground" onClick={() => download("html")}>Export printable HTML</button><button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground" onClick={() => download("markdown")}>Export Markdown</button></div>
    <p className="text-xs leading-6 text-foreground-muted">HTML can be opened and printed to PDF. Exports use the currently calculated dataset and weights. Review assumptions before sharing.</p>
    <details><summary className="cursor-pointer text-sm text-foreground">Preview summary</summary><div className="mt-4 space-y-5">
      <h4 className="text-lg font-semibold text-foreground">{report.title}</h4>{report.note ? <p className="whitespace-pre-wrap text-sm text-foreground-muted">{report.note}</p> : null}
      {report.tables.map((table) => <div key={table.title} className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm text-foreground"><caption className="pb-2 text-left font-semibold">{table.title}</caption><thead><tr>{table.headers.map((header) => <th key={header} className="p-2">{header}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={index} className="border-t border-white/10">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-2">{cell}</td>)}</tr>)}</tbody></table></div>)}
      <h4 className="font-semibold text-foreground">Assumptions and limitations</h4><ul className="space-y-2 text-xs leading-6 text-foreground-muted">{report.notes.map((text) => <li key={text}>{text}</li>)}</ul>
    </div></details>
    {message ? <p role="status" className="text-sm text-emerald-300">{message}</p> : null}
  </section>;
}
