// Decorative workflow illustration: trigger → AI → two outputs.
export default function HeroGraphic() {
  const node = "fill-white stroke-slate-200";
  return (
    <div className="relative hidden lg:block" aria-hidden>
      <div className="card relative overflow-hidden p-4 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.35)]">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        </div>
        <svg viewBox="0 0 440 260" className="w-full">
          <defs>
            <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-slate-200" />
            </pattern>
          </defs>
          <rect width="440" height="260" fill="url(#dots)" />
          {/* edges */}
          <g className="stroke-slate-300" strokeWidth="2" fill="none">
            <path d="M104 130 C 140 130, 140 130, 172 130" />
            <path d="M268 130 C 300 130, 300 70, 332 70" />
            <path d="M268 130 C 300 130, 300 190, 332 190" />
          </g>
          <circle r="4" className="fill-brand">
            <animateMotion dur="2.4s" repeatCount="indefinite" path="M104 130 C 140 130, 140 130, 172 130 L268 130 C 300 130, 300 70, 332 70" />
          </circle>
          {/* trigger */}
          <rect x="24" y="96" width="80" height="68" rx="34" strokeWidth="1.5" className={node} />
          <path d="M58 118 l-8 14 h10 l-4 14 l14 -18 h-10 l6 -10z" className="fill-amber-500" />
          {/* AI node */}
          <rect x="172" y="92" width="96" height="76" rx="12" strokeWidth="2" className="fill-white stroke-brand" />
          <text x="220" y="128" textAnchor="middle" className="fill-brand text-[15px] font-bold">AI</text>
          <text x="220" y="148" textAnchor="middle" className="fill-slate-400 text-[10px]">Agent</text>
          {/* outputs */}
          <rect x="332" y="40" width="84" height="60" rx="12" strokeWidth="1.5" className={node} />
          <rect x="350" y="58" width="48" height="6" rx="3" className="fill-sky-400" />
          <rect x="350" y="72" width="32" height="6" rx="3" className="fill-slate-200" />
          <rect x="332" y="160" width="84" height="60" rx="12" strokeWidth="1.5" className={node} />
          <rect x="350" y="178" width="48" height="6" rx="3" className="fill-emerald-400" />
          <rect x="350" y="192" width="32" height="6" rx="3" className="fill-slate-200" />
        </svg>
      </div>
      <div className="absolute -bottom-5 -left-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-lg">
        <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-mono text-xs">Ctrl</kbd>
        <span className="text-ink-mute">+</span>
        <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-mono text-xs">V</kbd>
        <span className="ml-1 text-emerald-600">✓</span>
      </div>
    </div>
  );
}
