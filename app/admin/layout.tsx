import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  if (!profile?.is_admin) notFound();
  const t = getDict();
  const tabs = [
    ["/admin", t.tab_payments],
    ["/admin/users", t.tab_users],
    ["/admin/upload", t.tab_upload],
  ];
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold">{t.admin_title}</h1>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="shrink-0 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-ink-soft hover:border-slate-300 hover:text-ink">
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
