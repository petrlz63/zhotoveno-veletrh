"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { serviceCategories } from "@/lib/service-categories";

type Values = { email: string; companyName: string; industry: string; consent: boolean };
type Errors = Partial<Record<keyof Values, string>>;
type ApiResponse = { ok: true } | { ok: false; errors?: Errors; message?: string };

const initialValues: Values = { email: "", companyName: "", industry: "", consent: false };
const fieldOrder: Array<keyof Values> = ["email", "industry", "consent"];
const technicalError = "Připomenutí se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu.";

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.email.trim()) errors.email = "Zadejte pracovní e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Zadejte e-mail ve správném formátu.";
  if (!values.industry) errors.industry = "Vyberte hlavní obor ze seznamu.";
  if (!values.consent) errors.consent = "Potvrďte prosím souhlas se zpracováním údajů.";
  return errors;
}

function createSubmissionId() {
  return crypto.randomUUID();
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "váš e-mail";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

const inputClass = (hasError: boolean) => [
  "mt-2 h-12 w-full rounded-xl border bg-white px-4 text-base text-brand-navy outline-none transition placeholder:text-brand-soft",
  hasError ? "border-red-400 focus-visible:ring-4 focus-visible:ring-red-300" : "border-brand-border focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-ring",
].join(" ");

export function FairReminderForm() {
  const [values, setValues] = useState<Values>(initialValues);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const emailRef = useRef<HTMLInputElement>(null);
  const industryRef = useRef<HTMLSelectElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusEmailRef = useRef(false);
  const refs = { email: emailRef, industry: industryRef, consent: consentRef, companyName: emailRef };

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    if (status === "idle" && shouldFocusEmailRef.current) {
      emailRef.current?.focus();
      shouldFocusEmailRef.current = false;
    }
  }, [status]);

  function updateValue(name: keyof Values, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError(null);
  }

  function focusFirstError(nextErrors: Errors) {
    const first = fieldOrder.find((field) => nextErrors[field]);
    if (!first) return;
    const element = refs[first].current;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    element?.focus({ preventScroll: true });
  }

  function reset() {
    setValues(initialValues);
    setWebsite("");
    setErrors({});
    setSubmitError(null);
    setSubmittedEmail("");
    setSubmissionId(createSubmissionId());
    shouldFocusEmailRef.current = true;
    setStatus("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length) return focusFirstError(nextErrors);

    setStatus("loading");
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/pripomenuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          submissionId,
          website,
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
        }),
      });
      const result = await response.json().catch(() => null) as ApiResponse | null;
      if (!response.ok || !result?.ok) {
        if (result && "errors" in result && result.errors) {
          setErrors(result.errors);
          focusFirstError(result.errors);
        } else {
          setSubmitError(result && "message" in result && result.message ? result.message : technicalError);
        }
        setStatus("idle");
        return;
      }
      setSubmittedEmail(values.email.trim());
      setValues(initialValues);
      setWebsite("");
      setStatus("success");
    } catch {
      setSubmitError(technicalError);
      setStatus("idle");
    }
  }

  if (status === "success") {
    return <section className="form-card text-center" role="status" aria-live="polite">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-sky text-2xl font-black text-brand-primary" aria-hidden="true">✓</span>
      <h2 ref={successRef} tabIndex={-1} className="mt-5 text-2xl font-black tracking-tight text-brand-navy outline-none">Hotovo! Připomenutí jsme odeslali.</h2>
      <p className="mt-3 text-base leading-7 text-brand-muted">E-mail pro {maskEmail(submittedEmail)} by měl dorazit během několika minut. Pokud ho neuvidíte, zkontrolujte také složku Hromadné nebo Spam.</p>
      <button type="button" onClick={reset} className="mt-6 h-12 rounded-xl border border-brand-primary px-5 text-base font-bold text-brand-primary transition hover:bg-brand-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">Zadat další kontakt</button>
    </section>;
  }

  return <form onSubmit={submit} noValidate className="form-card">
    <div className="hidden" aria-hidden="true"><label htmlFor="website">Web firmy</label><input id="website" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
    <div>
      <label htmlFor="email" className="text-base font-bold text-brand-navy">Pracovní e-mail <span className="text-red-500">*</span></label>
      <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={(event) => updateValue("email", event.target.value)} required aria-required="true" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={inputClass(Boolean(errors.email))} />
      {errors.email && <p id="email-error" className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
    </div>
    <div className="mt-4">
      <label htmlFor="companyName" className="text-base font-bold text-brand-navy">Název firmy <span className="font-normal text-brand-muted">(nepovinné)</span></label>
      <input id="companyName" name="companyName" type="text" autoComplete="organization" maxLength={150} value={values.companyName} onChange={(event) => updateValue("companyName", event.target.value)} className={inputClass(false)} />
    </div>
    <div className="mt-4">
      <label htmlFor="industry" className="text-base font-bold text-brand-navy">Hlavní obor <span className="text-red-500">*</span></label>
      <select ref={industryRef} id="industry" name="industry" value={values.industry} onChange={(event) => updateValue("industry", event.target.value)} required aria-required="true" aria-invalid={Boolean(errors.industry)} aria-describedby={errors.industry ? "industry-error" : undefined} className={inputClass(Boolean(errors.industry))}>
        <option value="">Vyberte obor</option>{serviceCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
      </select>
      {errors.industry && <p id="industry-error" className="mt-1.5 text-xs text-red-500">{errors.industry}</p>}
    </div>
    <div className={`mt-5 ${errors.consent ? "rounded-xl border border-red-400 p-3" : ""}`}>
      <div className="flex items-start gap-3"><input ref={consentRef} id="consent" name="consent" type="checkbox" checked={values.consent} onChange={(event) => updateValue("consent", event.target.checked)} required aria-required="true" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} className={`mt-1 h-5 w-5 shrink-0 rounded ${errors.consent ? "border-red-400 focus-visible:ring-red-300" : "border-brand-border"} text-brand-primary focus-visible:ring-4`} />
        <label htmlFor="consent" className="text-base leading-6 text-brand-muted">Souhlasím se zasláním informačního e-mailu o službě Zhotoveno a se zpracováním uvedených údajů pro tento účel. <Link href="/ochrana-soukromi" className="font-semibold text-brand-primary underline">Zásady ochrany osobních údajů</Link> <span className="text-red-500">*</span></label>
      </div>
      {errors.consent && <p id="consent-error" className="mt-1.5 text-xs text-red-500">{errors.consent}</p>}
    </div>
    <p className="mt-5 text-sm leading-6 text-brand-muted">Odesláním formuláře ještě nevytváříte účet ani firemní profil.</p>
    <button type="submit" disabled={status === "loading"} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-base font-black text-white shadow-[0_16px_34px_rgba(9,105,243,0.25)] transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring disabled:cursor-not-allowed disabled:opacity-70">
      {status === "loading" && <span className="spinner" aria-hidden="true" />} {status === "loading" ? "Odesíláme…" : "Poslat připomenutí"}
    </button>
    {submitError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</p>}
  </form>;
}
