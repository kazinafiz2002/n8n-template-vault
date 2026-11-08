import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { getDict, getLang } from "@/lib/i18n";
import { deleteTemplate } from "@/app/actions";
import CopyButton from "@/components/CopyButton";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { supabase } = await getSession();
  const { data } = await supabase.from("templates").select("title,description").eq("slug", params.slug).single();
  return data ? { title: data.title, description: data.description?.slice(0, 160) } : {};
}

export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const t = getDict();
  const { supabase, user, profile } = await getSession();
  const { data: tpl } = await supabase
    .from("templates")
    .select("id,slug,title,description,category,services,node_count")
    .eq("slug", params.slug)
    .single();
  if (!tpl) notFound();

  const canCopy = !!(profile?.has_access || profile?.is_admin);
  let pending = false;
  if (user && !canCopy) {
    const { count } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
    pending = (count || 0) > 0;
  }

  return (
    <div className="py-8">
      <Link href="/" className="text-sm text-ink-mute hover:text-ink">{t.back}</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="card p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">{tpl.category}</span>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{tpl.title}</h1>
          {tpl.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{tpl.description}</p>}

          {tpl.services.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-ink-soft">{t.services}</h2>
              <div className="flex flex-wrap gap-1.5">
                {tpl.services.map((s: string) => <span key={s} className="chip">{s}</span>)}
                <span className="chip bg-transparent">{tpl.node_count.toLocaleString(getLang() === "bn" ? "bn-BD" : "en")} {t.nodes}</span>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 font-semibold">{t.how_title}</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
              {t.how_steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
        </article>

        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          {canCopy ? (
            <CopyButton
              templateId={tpl.id}
              slug={tpl.slug}
              labels={{ copy: t.copy, copied: t.copied, copying: t.copying, download: t.download, err_daily: t.err_daily, err_generic: t.err_generic }}
            />
          ) : pending ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{t.pending_note}</p>
          ) : (
            <div>
              <h2 className="font-semibold">{t.locked_title}</h2>
              <p className="mt-1 text-sm text-ink-mute">{t.locked_body}</p>
              <Link href={user ? "/pricing" : `/login?next=/templates/${tpl.slug}`} className="btn-primary mt-4 w-full">
                {user ? t.locked_cta : t.login_to_copy}
              </Link>
            </div>
          )}

          {profile?.is_admin && (
            <form action={deleteTemplate} className="mt-4 border-t border-slate-200 pt-4">
              <input type="hidden" name="id" value={tpl.id} />
              <button className="text-sm font-medium text-red-600 hover:underline">{t.delete}</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
