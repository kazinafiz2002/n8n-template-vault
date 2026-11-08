"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Labels = { copy: string; copied: string; copying: string; download: string; err_daily: string; err_generic: string };

export default function CopyButton({ templateId, slug, labels }: { templateId: string; slug: string; labels: Labels }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function fetchWorkflow() {
    const { data, error } = await createClient().rpc("get_template_workflow", { tid: templateId });
    if (error) throw new Error(error.message.includes("DAILY_LIMIT") ? labels.err_daily : labels.err_generic);
    return JSON.stringify(data, null, 2);
  }

  async function copy() {
    setError("");
    setState("busy");
    try {
      const json = await fetchWorkflow();
      await navigator.clipboard.writeText(json);
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch (e) {
      setError((e as Error).message || labels.err_generic);
      setState("idle");
    }
  }

  async function download() {
    setError("");
    try {
      const json = await fetchWorkflow();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `${slug}.json` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message || labels.err_generic);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} disabled={state === "busy"} className={`btn-primary flex-1 ${state === "done" ? "!bg-emerald-600" : ""}`}>
          {state === "busy" ? labels.copying : state === "done" ? labels.copied : labels.copy}
        </button>
        <button onClick={download} className="btn-ghost">{labels.download}</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
