import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { getDict, getLang } from "@/lib/i18n";
import { logout, setLang } from "@/app/actions";
import { site } from "@/lib/site";

export default async function Header() {
  const { profile } = await getSession();
  const lang = getLang();
  const t = getDict(lang);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm text-white">n8</span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
          <Link href="/" className="hover:text-ink">{t.nav_templates}</Link>
          {!profile?.has_access && !profile?.is_admin && (
            <Link href="/pricing" className="hover:text-ink">{t.nav_pricing}</Link>
          )}
          {profile?.is_admin && <Link href="/admin" className="hover:text-ink">{t.nav_admin}</Link>}
          {site.portfolio && <a href={site.portfolio} className="hidden hover:text-ink md:inline">{t.nav_portfolio}</a>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action={setLang}>
            <input type="hidden" name="lang" value={lang === "bn" ? "en" : "bn"} />
            <button className="btn-ghost px-3 py-1.5" aria-label="Switch language">
              {lang === "bn" ? "English" : "বাংলা"}
            </button>
          </form>
          {profile ? (
            <form action={logout}>
              <button className="btn-ghost px-3 py-1.5">{t.nav_logout}</button>
            </form>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-1.5">{t.nav_login}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
