import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import { login, signup } from "@/app/actions";

type Search = { mode?: string; error?: string; next?: string; confirm?: string };

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const t = getDict();
  const { user } = await getSession();
  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/";
  if (user) redirect(next);
  const isSignup = searchParams.mode === "signup";

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">{isSignup ? t.signup_title : t.login_title}</h1>

      {searchParams.confirm && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t.check_email}</p>}
      {searchParams.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>}

      <form action={isSignup ? signup : login} className="card mt-6 space-y-4 p-6">
        <input type="hidden" name="next" value={next} />
        {isSignup && (
          <div>
            <label className="label" htmlFor="full_name">{t.name}</label>
            <input id="full_name" name="full_name" required className="input" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">{t.email}</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.password}</label>
          <input id="password" name="password" type="password" required minLength={6} className="input"
            autoComplete={isSignup ? "new-password" : "current-password"} />
        </div>
        <button className="btn-primary w-full">{isSignup ? t.signup_btn : t.login_btn}</button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link className="text-brand hover:underline"
          href={`/login?${isSignup ? "" : "mode=signup&"}next=${encodeURIComponent(next)}`}>
          {isSignup ? t.have_account : t.no_account}
        </Link>
      </p>
    </div>
  );
}
