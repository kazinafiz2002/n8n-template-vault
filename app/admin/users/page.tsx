import { getSession } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import { setUserAccess } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string } }) {
  const t = getDict();
  const { supabase } = await getSession();
  const q = (searchParams.q || "").trim().replace(/[%_,()]/g, "");

  let query = supabase
    .from("profiles")
    .select("id,email,full_name,has_access,is_admin,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("email", `%${q}%`);
  const { data: users } = await query;

  return (
    <>
      <form className="mb-4 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder={t.search_users} className="input" />
        <button className="btn-ghost">{t.search_btn}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-200 text-left text-ink-mute">
            <tr><th className="p-3">{t.email}</th><th className="p-3">{t.joined}</th><th className="p-3">{t.access}</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><p className="font-medium">{u.email}</p><p className="text-ink-mute">{u.full_name}</p></td>
                <td className="p-3 text-ink-mute">{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                <td className="p-3">
                  {u.is_admin ? <span className="chip">admin</span> : u.has_access
                    ? <span className="chip bg-emerald-100 text-emerald-800">✓</span>
                    : <span className="chip">—</span>}
                </td>
                <td className="p-3 text-right">
                  {!u.is_admin && (
                    <form action={setUserAccess}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="grant" value={u.has_access ? "0" : "1"} />
                      <button className={u.has_access ? "btn-ghost px-3 py-1.5" : "btn-primary px-3 py-1.5"}>
                        {u.has_access ? t.revoke : t.grant}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
