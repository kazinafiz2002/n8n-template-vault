"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export async function setLang(formData: FormData) {
  const lang = formData.get("lang") === "en" ? "en" : "bn";
  cookies().set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "/";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const origin = headers().get("origin") || "";
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
    options: {
      data: { full_name: String(formData.get("full_name") || "").trim() },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  if (data.session) redirect(next);
  // Accounts are auto-confirmed in the database, so log straight in.
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  });
  redirect(loginError ? "/login?confirm=1" : next);
}

export async function logout() {
  await createClient().auth.signOut();
  redirect("/");
}

export async function submitPayment(formData: FormData) {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login?next=/pricing");

  const method = formData.get("method") === "nagad" ? "nagad" : "bkash";
  const sender = String(formData.get("sender") || "").replace(/[^\d+]/g, "");
  const trx = String(formData.get("trx_id") || "").trim().toUpperCase().replace(/\s+/g, "");
  if (sender.length < 11 || trx.length < 6) redirect("/pricing?error=invalid");

  const { error } = await supabase.from("payments").insert({
    user_id: user.id, method, sender_number: sender, trx_id: trx, amount: site.price,
  });
  if (error) redirect(`/pricing?error=${error.code === "23505" ? "dup" : "generic"}`);
  revalidatePath("/pricing");
  redirect("/pricing?ok=1");
}

async function requireAdmin() {
  const s = await getSession();
  if (!s.profile?.is_admin) throw new Error("Not admin");
  return s;
}

export async function reviewPayment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const approve = formData.get("decision") === "approve";

  const { data: payment, error } = await supabase
    .from("payments")
    .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("user_id")
    .single();
  if (error) throw error;

  if (approve && payment) {
    await supabase.from("profiles")
      .update({ has_access: true, access_granted_at: new Date().toISOString() })
      .eq("id", payment.user_id);
  }
  revalidatePath("/admin");
}

export async function setUserAccess(formData: FormData) {
  const { supabase } = await requireAdmin();
  const grant = formData.get("grant") === "1";
  await supabase.from("profiles")
    .update({ has_access: grant, access_granted_at: grant ? new Date().toISOString() : null })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/users");
}

export async function deleteTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("templates").delete().eq("id", String(formData.get("id")));
  revalidatePath("/");
  redirect("/");
}
