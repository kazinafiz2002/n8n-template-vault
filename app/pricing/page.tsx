import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { getDict, getLang } from "@/lib/i18n";
import { submitPayment } from "@/app/actions";
import { site } from "@/lib/site";

type Search = { ok?: string; error?: string };

export default async function PricingPage({ searchParams }: { searchParams: Search }) {
  const lang = getLang();
  const t = getDict(lang);
  const { supabase, user, profile } = await getSession();
  const hasAccess = !!(profile?.has_access || profile?.is_admin);

  const { data: payments } = user
    ? await supabase.from("payments").select("id,method,trx_id,status,created_at").order("created_at", { ascending: false })
    : { data: null };

  const hasPending = !!payments?.some((p) => p.status === "pending");
  const price = lang === "bn" ? site.price.toLocaleString("bn-BD") : site.price.toLocaleString("en");
  const statusLabel = { pending: t.status_pending, approved: t.status_approved, rejected: t.status_rejected } as Record<string, string>;
  const statusColor = { pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-700" } as Record<string, string>;

  return (
    <div className="grid gap-8 py-12 lg:grid-cols-[380px_1fr]">
      <section className="card h-fit p-6">
        <h1 className="text-xl font-bold">{t.pricing_title}</h1>
        <p className="mt-1 text-sm text-ink-mute">{t.pricing_sub}</p>
        <p className="mt-6 text-4xl font-bold">৳{price} <span className="text-base font-medium text-ink-mute">{t.one_time}</span></p>
        <ul className="mt-6 space-y-2 text-sm">
          {t.features.map((f) => (
            <li key={f} className="flex gap-2"><span className="text-emerald-600">✓</span>{f}</li>
          ))}
        </ul>
      </section>

      <section>
        {hasAccess ? (
          <div className="card p-6">
            <p className="text-emerald-700">{t.already_access}</p>
            <Link href="/" className="btn-primary mt-4">{t.nav_templates}</Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{t.pay_title}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
              {t.pay_steps(site.price).map((s) => <li key={s}>{s}</li>)}
            </ol>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="card border-l-4 border-l-pink-600 p-4">
                <p className="text-sm font-semibold text-pink-700">bKash · {t.personal}</p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wide">{site.bkash}</p>
              </div>
              <div className="card border-l-4 border-l-orange-500 p-4">
                <p className="text-sm font-semibold text-orange-600">Nagad · {t.personal}</p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wide">{site.nagad}</p>
              </div>
            </div>

            {searchParams.ok && !hasPending && <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t.payment_submitted}</p>}
            {searchParams.error && (
              <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {searchParams.error === "dup" ? t.payment_dup : t.err_generic}
              </p>
            )}

            {hasPending ? (
              <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{t.pending_note}</p>
            ) : !user ? (
              <div className="card mt-6 p-6">
                <p className="text-sm text-ink-soft">{t.login_first}</p>
                <Link href="/login?mode=signup&next=/pricing" className="btn-primary mt-4">{t.signup_btn}</Link>
              </div>
            ) : (
              <form action={submitPayment} className="card mt-6 grid gap-4 p-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="label">{t.method}</span>
                  <div className="flex gap-3">
                    {(["bkash", "nagad"] as const).map((m, i) => (
                      <label key={m} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-tint">
                        <input type="radio" name="method" value={m} defaultChecked={i === 0} className="accent-brand" />
                        {m === "bkash" ? "bKash" : "Nagad"}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="sender">{t.sender}</label>
                  <input id="sender" name="sender" required inputMode="tel" placeholder="01XXXXXXXXX" pattern="[0-9+ ]{11,15}" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="trx_id">{t.trxid}</label>
                  <input id="trx_id" name="trx_id" required minLength={6} placeholder="9A7B6C5D4E" className="input font-mono uppercase" />
                </div>
                <button className="btn-primary sm:col-span-2">{t.submit_payment}</button>
              </form>
            )}
          </>
        )}

        {!!payments?.length && (
          <div className="mt-8">
            <h3 className="mb-2 text-sm font-semibold text-ink-soft">{t.your_payments}</h3>
            <ul className="card divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-mono">{p.method === "bkash" ? "bKash" : "Nagad"} · {p.trx_id}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusColor[p.status]}`}>{statusLabel[p.status]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
