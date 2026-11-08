import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDict, getLang } from "@/lib/i18n";
import { site } from "@/lib/site";
import HeroGraphic from "@/components/HeroGraphic";

const PAGE_SIZE = 24;

type Search = { q?: string; cat?: string; page?: string };

function buildHref(params: Search) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  if (params.page && params.page !== "1") sp.set("page", params.page);
  const s = sp.toString();
  return (s ? `/?${s}` : "/") + "#templates";
}

export default async function Home({ searchParams }: { searchParams: Search }) {
  const lang = getLang();
  const t = getDict(lang);
  const supabase = createClient();
  const q = (searchParams.q || "").trim().slice(0, 80);
  const cat = searchParams.cat || "";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const filtering = !!(q || cat || page > 1);
  const num = (n: number) => n.toLocaleString(lang === "bn" ? "bn-BD" : "en");

  let query = supabase
    .from("templates")
    .select("id,slug,title,description,category,services,node_count", { count: "exact" })
    .order("title")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (cat) query = query.eq("category", cat);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ");
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const [{ data: templates, count }, { data: cats }, { count: total }] = await Promise.all([
    query,
    supabase.rpc("template_categories"),
    supabase.from("templates").select("id", { count: "exact", head: true }),
  ]);

  const pages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const categories = (cats || []) as { category: string; total: number }[];

  return (
    <>
      {/* ───── Hero ───── */}
      {!filtering && (
        <section className="relative pb-14 pt-12 sm:pt-16">
          <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-[420px] w-[620px] max-w-full rounded-full bg-[radial-gradient(closest-side,#fde3dc,transparent)] blur-2xl" />
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-3 py-1 text-xs font-semibold text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t.badge}
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl">{t.hero_title}</h1>
              <p className="mt-4 max-w-xl text-lg text-ink-mute">{t.hero_sub(total || 0)}</p>
              <form className="mt-7 flex max-w-xl gap-2" action="/#templates">
                <input name="q" placeholder={t.search_ph} className="input h-12 shadow-sm" />
                <button className="btn-primary h-12 shrink-0 px-5">{t.search_btn}</button>
              </form>
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  [num(total || 0), t.stat_templates],
                  [num(categories.length), t.stat_categories],
                  [t.stat_lifetime_v, t.stat_lifetime],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="text-2xl font-bold">{v}</dt>
                    <dd className="text-sm text-ink-mute">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroGraphic />
          </div>
        </section>
      )}

      {/* ───── Template browser ───── */}
      <section id="templates" className={`scroll-mt-20 ${filtering ? "pt-8" : "pt-4"}`}>
        {filtering && (
          <form className="mb-6 flex max-w-2xl gap-2" action="/#templates">
            {cat && <input type="hidden" name="cat" value={cat} />}
            <input name="q" defaultValue={q} placeholder={t.search_ph} className="input" />
            <button className="btn-primary shrink-0">{t.search_btn}</button>
          </form>
        )}
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible">
              <Link
                href={buildHref({ q })}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${!cat ? "bg-ink text-white" : "text-ink-soft hover:bg-slate-200"}`}
              >
                {t.all_categories}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.category}
                  href={buildHref({ q, cat: c.category })}
                  className={`flex shrink-0 justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium ${cat === c.category ? "bg-ink text-white" : "text-ink-soft hover:bg-slate-200"}`}
                >
                  <span>{c.category}</span>
                  <span className="opacity-60">{num(c.total)}</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm text-ink-mute">{t.results(count || 0)}</p>
            {!templates?.length ? (
              <div className="card p-10 text-center text-ink-mute">{t.no_results}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {templates.map((tpl) => (
                  <Link key={tpl.id} href={`/templates/${tpl.slug}`}
                    className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-[0_8px_24px_-12px_rgba(232,85,61,0.35)]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand">{tpl.category}</span>
                    <h2 className="mt-1.5 font-semibold leading-snug group-hover:text-brand">{tpl.title}</h2>
                    {tpl.description && <p className="mt-2 line-clamp-2 text-sm text-ink-mute">{tpl.description}</p>}
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {tpl.services.slice(0, 4).map((s: string) => <span key={s} className="chip">{s}</span>)}
                      <span className="chip bg-transparent">{num(tpl.node_count)} {t.nodes}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {pages > 1 && (
              <nav className="mt-8 flex items-center justify-between gap-3 text-sm">
                {page > 1 ? <Link className="btn-ghost" href={buildHref({ q, cat, page: String(page - 1) })}>{t.prev}</Link> : <span />}
                <span className="text-ink-mute">{t.page_of(page, pages)}</span>
                {page < pages ? <Link className="btn-ghost" href={buildHref({ q, cat, page: String(page + 1) })}>{t.next}</Link> : <span />}
              </nav>
            )}
          </div>
        </div>
      </section>

      {!filtering && (
        <>
          {/* ───── How it works ───── */}
          <section className="mt-24">
            <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">{t.how_it_title}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {t.how_it.map(([title, body], i) => (
                <div key={title} className="card p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-tint font-bold text-brand">{num(i + 1)}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ───── CTA ───── */}
          <section className="mt-16 overflow-hidden rounded-2xl bg-ink px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">{t.cta_title}</h2>
                <p className="mt-2 max-w-lg text-slate-300">{t.cta_body}</p>
              </div>
              <div className="flex items-center gap-5">
                <p className="text-3xl font-bold">৳{num(site.price)}<span className="ml-1 text-sm font-medium text-slate-400">{t.one_time}</span></p>
                <Link href="/pricing" className="btn-primary h-12 px-6">{t.locked_cta}</Link>
              </div>
            </div>
          </section>

          {/* ───── FAQ ───── */}
          <section className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight">{t.faq_title}</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {t.faq.map(([qq, a]) => (
                <details key={qq} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {qq}
                    <span className="text-xl leading-none text-ink-mute transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
