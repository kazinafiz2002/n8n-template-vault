"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { processWorkflowFile } from "@/lib/workflow.mjs";

type Labels = {
  help: string; pickFiles: string; pickFolder: string; folderAsCategory: string;
  start: string; uploaded: string; skipped: string; failed: string;
};

const BATCH = 40;

export default function UploadForm({ labels }: { labels: Labels }) {
  const [files, setFiles] = useState<File[]>([]);
  const [useFolder, setUseFolder] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [stats, setStats] = useState({ inserted: 0, skipped: 0 });
  const [errors, setErrors] = useState<string[]>([]);

  function pick(list: FileList | null) {
    const arr = Array.from(list || []).filter((f) => /\.(json|txt)$/i.test(f.name));
    setFiles(arr);
    setDone(0);
    setStats({ inserted: 0, skipped: 0 });
    setErrors([]);
  }

  async function upload() {
    setBusy(true);
    const supabase = createClient();
    const errs: string[] = [];
    let inserted = 0, skipped = 0;

    for (let i = 0; i < files.length; i += BATCH) {
      const chunk = files.slice(i, i + BATCH);
      const items: unknown[] = [];
      for (const f of chunk) {
        const parts = (f.webkitRelativePath || "").split("/");
        const folder = useFolder && parts.length > 2 ? parts[parts.length - 2] : undefined;
        const r = processWorkflowFile(await f.text(), f.name, folder);
        if (r.ok) items.push(r.item);
        else errs.push(`${f.name}: ${r.error}`);
      }
      if (items.length) {
        const { data, error } = await supabase.rpc("admin_import_templates", { items });
        if (error) errs.push(`Batch ${i / BATCH + 1}: ${error.message}`);
        else { inserted += data.inserted; skipped += data.skipped; }
      }
      setDone(Math.min(i + BATCH, files.length));
      setStats({ inserted, skipped });
      setErrors([...errs]);
    }
    setBusy(false);
  }

  const pct = files.length ? Math.round((done / files.length) * 100) : 0;

  return (
    <div className="card max-w-2xl p-6">
      <p className="text-sm text-ink-soft">{labels.help}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <label className="btn-ghost cursor-pointer">
          {labels.pickFiles}
          <input type="file" multiple accept=".json,.txt" className="hidden" onChange={(e) => pick(e.target.files)} />
        </label>
        <label className="btn-ghost cursor-pointer">
          {labels.pickFolder}
          <input
            ref={(el) => el?.setAttribute("webkitdirectory", "")}
            type="file" className="hidden" onChange={(e) => pick(e.target.files)}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={useFolder} onChange={(e) => setUseFolder(e.target.checked)} className="accent-brand" />
        {labels.folderAsCategory}
      </label>

      {files.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium">{files.length.toLocaleString()} files</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-mute">
            {done}/{files.length} · {labels.uploaded}: <b className="text-emerald-700">{stats.inserted}</b> · {labels.skipped}: {stats.skipped} · {labels.failed}: <b className="text-red-600">{errors.length}</b>
          </p>
          <button onClick={upload} disabled={busy || done === files.length} className="btn-primary mt-4">
            {busy ? `${pct}%` : labels.start}
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <pre className="mt-4 max-h-60 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-800">{errors.join("\n")}</pre>
      )}
    </div>
  );
}
