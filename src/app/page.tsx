import Image from "next/image";

import { FairReminderForm } from "@/components/FairReminderForm";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <main className="min-h-screen px-4 py-3 sm:px-6 sm:py-8 lg:flex lg:items-center lg:px-8">
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex items-center gap-3"><Image src="/zhotoveno-logo-vektor.svg" alt="Zhotoveno" width={40} height={40} priority className="h-10 w-10" /><span className="text-xl font-black tracking-tight text-brand-navy">Zhotoveno</span></header>
      <div className="mt-4 grid items-center gap-5 lg:mt-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="lg:py-5">
          <p className="inline-flex rounded-xl bg-brand-sky px-3 py-1.5 text-sm font-bold text-brand-primary sm:px-4 sm:py-2">Zhotoveno pro firmy</p>
          <h1 className="mt-3 max-w-xl text-3xl font-black leading-[1.08] tracking-tight text-brand-navy sm:mt-5 sm:text-5xl">Nechte si poslat připomenutí</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-brand-muted sm:mt-5 sm:text-lg sm:leading-8">Pošleme vám e-mail s odkazy na web a mobilní aplikaci. Firemní profil si potom vytvoříte v klidu.</p>
          <div className="mt-6 hidden gap-3 rounded-2xl bg-white/75 p-4 text-base leading-6 text-brand-muted shadow-[0_10px_24px_rgba(6,22,52,0.04)] lg:flex"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-sky font-black text-brand-primary" aria-hidden="true">1</span><p>Po přihlášení pomocí e-mailu vás provedeme vytvořením firemního profilu a nastavením oborů.</p></div>
        </section>
        <FairReminderForm />
      </div>
      <footer className="mt-6 hidden text-center text-sm text-brand-muted sm:block">© 2026 Zhotoveno s.r.o.</footer>
    </div>
  </main>;
}
