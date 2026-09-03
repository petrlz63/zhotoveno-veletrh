import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ochrana soukromí", robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"><article className="mx-auto max-w-3xl rounded-[2rem] border border-brand-border bg-white p-6 shadow-[0_18px_50px_rgba(6,22,52,0.08)] sm:p-9">
    <Link href="/" className="text-sm font-bold text-brand-primary underline">Zpět na formulář</Link>
    <p className="mt-8 text-sm font-bold text-brand-primary">Zhotoveno pro firmy</p><h1 className="mt-2 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">Zásady ochrany osobních údajů</h1>
    <div className="mt-7 space-y-6 text-base leading-7 text-brand-muted">
      <section><h2 className="text-xl font-black text-brand-navy">Správce údajů</h2><p className="mt-2">Správcem osobních údajů je ZHOTOVENO s.r.o., IČO 24593214, se sídlem Chudenická 1059/30, 102 00 Praha, Česká republika.</p></section>
      <section><h2 className="text-xl font-black text-brand-navy">Účel a rozsah</h2><p className="mt-2">Údaje z formuláře zpracováváme výhradně pro zaslání jednorázového informačního e-mailu o službě Zhotoveno po osobním setkání. Formulář nevytváří účet ani firemní profil.</p><p className="mt-2">Zpracováváme pracovní e-mail, nepovinný název firmy, hlavní obor, název akce, čas a verzi souhlasu, dostupné UTM parametry, stav odeslání e-mailu a omezená technická metadata: hash IP adresy a user-agent.</p></section>
      <section><h2 className="text-xl font-black text-brand-navy">Právní základ a uchování</h2><p className="mt-2">Právním základem je váš souhlas podle čl. 6 odst. 1 písm. a) GDPR. Údaje uchováváme nejdéle 12 měsíců, pokud souhlas neodvoláte dříve.</p></section>
      <section><h2 className="text-xl font-black text-brand-navy">Příjemci a vaše práva</h2><p className="mt-2">Údaje mohou v nezbytném rozsahu zpracovávat oprávněné osoby správce a techničtí poskytovatelé hostingu a doručení e-mailu. Máte právo požadovat přístup, opravu, výmaz, omezení zpracování, přenositelnost a souhlas kdykoli odvolat.</p><p className="mt-2">Dotazy a odvolání souhlasu směřujte na <a className="font-bold text-brand-primary underline" href="mailto:gdpr@zhotoveno.cz">gdpr@zhotoveno.cz</a>.</p></section>
    </div>
  </article></main>;
}
