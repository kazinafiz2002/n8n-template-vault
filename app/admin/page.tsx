import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import { reviewPayment } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminPayments({ searchParams }: { searchParams: { all?: string } }) {
  const t = getDict();
  const { supabase } = await getSession();
  const showAll = searchParams.all === "1";

  let q = supabase
    .from("payments")
    .select("id,method,sender_number,trx_id,amount,status,created_at,profiles(email,full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showAll) q = q.eq("status", "pending");
  const { data: payments } = await q;

  const badge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-700",
  };

  return (
    <>
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/admin" className={!showAll ? "btn-primary px-3 py-1.5" : "btn-ghost px-3 py-1.5"}>{t.filter_pending}</Link>
        <Link href="/admin?all=1" className={showAll ? "btn-primary px-3 py-1.5" : "btn-ghost px-3 py-1.5"}>{t.filter_all}</Link>
      </div>
      {!payments?.length ? (
        <div className="card p-8 text-center text-ink-mute">{t.no_pending}</div>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => {
            const prof = p.profiles as unknown as { email: string; full_name: string | null } | null;
            return (
              <li key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{prof?.full_name || "—"} <span className="font-normal text-ink-mute">{prof?.email}</span></p>
                  <p className="mt-1 font-mono">
                    <span className={p.method === "bkash" ? "text-pink-700" : "text-orange-600"}>{p.method === "bkash" ? "bKash" : "Nagad"}</span>
                    {" · "}{p.sender_number}{" · "}<b>{p.trx_id}</b>{" · "}৳{p.amount}
                  </p>
                  <p className="mt-1 text-xs text-ink-mute">{new Date(p.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</p>
                </div>
                {p.status === "pending" ? (
                  <div className="flex gap-2">
                    {(["approve", "reject"] as const).map((d) => (
                      <form key={d} action={reviewPayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="decision" value={d} />
                        <button className={d === "approve" ? "btn !bg-emerald-600 text-white hover:!bg-emerald-700" : "btn-ghost"}>
                          {d === "approve" ? t.approve : t.reject}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : (
                  <span className={`self-start rounded-md px-2 py-0.5 text-xs font-semibold sm:self-center ${badge[p.status]}`}>{p.status}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
