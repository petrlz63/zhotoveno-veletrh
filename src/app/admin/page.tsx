import { redirect } from "next/navigation";

import { clearAdminSession, createAdminSession, isAdminSessionValid, verifyAdminKey } from "@/lib/admin-session";
import { listReminders, type ReminderListRecord } from "@/lib/fair-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { searchParams: Promise<{ error?: string | string[] }> };

async function loginAction(formData: FormData) {
  "use server";
  const key = formData.get("key");
  if (typeof key !== "string" || !verifyAdminKey(key) || !(await createAdminSession())) redirect("/admin?error=invalid");
  redirect("/admin");
}

async function logoutAction() {
  "use server";
  await clearAdminSession();
  redirect("/admin");
}

function dateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function LoginView({ hasError }: { hasError: boolean }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950"><section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Administrace veletrhu</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Přihlášení</h1><p className="mt-3 text-base text-slate-600">Zadejte administrátorský klíč pro zobrazení uložených kontaktů.</p>
    <form action={loginAction} className="mt-6 space-y-4"><div><label htmlFor="admin-key" className="block text-base font-semibold text-slate-800">Administrátorský klíč *</label><input id="admin-key" name="key" type="password" required aria-required="true" autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus-visible:ring-4 focus-visible:ring-slate-200" />{hasError && <p className="mt-2 text-xs text-red-500">Přihlášení se nezdařilo. Zkontrolujte klíč nebo konfiguraci.</p>}</div><button type="submit" className="h-12 w-full rounded-xl bg-slate-950 px-5 text-base font-semibold text-white hover:bg-slate-800">Přihlásit se</button></form>
  </section></main>;
}

function ReminderTable({ reminders }: { reminders: ReminderListRecord[] }) {
  if (!reminders.length) return <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Zatím nejsou uložené žádné kontakty.</div>;
  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1050px] divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Datum</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Firma</th><th className="px-4 py-3">Obor</th><th className="px-4 py-3">Akce</th><th className="px-4 py-3">Souhlas</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">UTM</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-800">{reminders.map((reminder) => <tr key={reminder.id} className="align-top"><td className="whitespace-nowrap px-4 py-4 text-slate-600">{dateTime(reminder.createdAt)}</td><td className="px-4 py-4"><a className="underline-offset-2 hover:underline" href={`mailto:${reminder.email}`}>{reminder.email}</a></td><td className="px-4 py-4 font-semibold text-slate-950">{reminder.companyName || "—"}</td><td className="px-4 py-4">{reminder.industryLabel}</td><td className="px-4 py-4">{reminder.eventName}</td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{dateTime(reminder.consentAcceptedAt)}</td><td className="px-4 py-4"><span className={reminder.emailStatus === "sent" ? "font-semibold text-emerald-700" : reminder.emailStatus === "failed" ? "font-semibold text-red-600" : "font-semibold text-amber-700"}>{reminder.emailStatus === "sent" ? "Odesláno" : reminder.emailStatus === "failed" ? "Neodesláno" : "Čeká"}</span><div className="mt-1 text-xs text-slate-500">Pokusy: {reminder.emailAttemptCount}</div></td><td className="max-w-56 px-4 py-4 text-slate-600">{[reminder.utmSource, reminder.utmMedium, reminder.utmCampaign].filter(Boolean).join(" · ") || "—"}</td></tr>)}</tbody></table></div></div>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  if (!(await isAdminSessionValid())) {
    const error = (await searchParams).error;
    return <LoginView hasError={Array.isArray(error) ? error.includes("invalid") : error === "invalid"} />;
  }
  const reminders = listReminders();
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8"><section className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Administrace veletrhu</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Kontakty</h1><p className="mt-2 text-base text-slate-600">Posledních {reminders.length} kontaktů z vlastní SQLite databáze.</p></div><form action={logoutAction}><button type="submit" className="h-12 rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-800 hover:bg-slate-100">Odhlásit se</button></form></div><ReminderTable reminders={reminders} /></section></main>;
}
