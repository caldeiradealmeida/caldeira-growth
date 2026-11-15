import ContactVerification from "@/components/ContactVerification";
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import ProductVideo from "@/components/ProductVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_FORM_SUBMIT_URL } from "@/constants/contactForm";
import { boardContent as b, boardOffers, type BoardOfferId } from "@/data/boardContent";
import { pushDataLayerEvent } from "@/lib/analytics";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";

/**
 * Caldeira | The Board — landing de teste de demanda (somente PT, /board).
 *
 * Eventos enviados ao dataLayer do GTM (sem dados pessoais):
 *   board_cta_click      { location }
 *   board_offer_click    { offer }
 *   board_form_start     { offer }
 *   board_form_submit    { offer, wealth_range, decides_how }
 *   product_video_*      { product: "board" }  (ver ProductVideo)
 */

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type Status = "idle" | "sending" | "success" | "error" | "invalid";

export default function Board() {
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationReset, setVerificationReset] = useState(0);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [offer, setOffer] = useState<BoardOfferId>("pacote");
  const [status, setStatus] = useState<Status>("idle");
  const formStarted = useRef(false);

  const goToForm = (location: string) => {
    pushDataLayerEvent("board_cta_click", { location });
  };

  const chooseOffer = (id: BoardOfferId) => {
    setOffer(id);
    pushDataLayerEvent("board_offer_click", { offer: id });
    document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    pushDataLayerEvent("board_form_start", { offer });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "").trim();

    // Honeypot: bots fill every field; people never see this one.
    if (text("website")) {
      setStatus("success");
      return;
    }

    const nome = text("nome");
    const email = text("email");
    const wealth = text("patrimonio");
    const how = text("como_decide");
    const thesis = text("tese");

    if (!nome || !/^\S+@\S+\.\S+$/.test(email) || !wealth || !how) {
      setStatus("invalid");
      return;
    }

    if (!verificationToken) { setStatus("error"); return; }

    const chosen = boardOffers.find((o) => o.id === offer) ?? boardOffers[0];
    setStatus("sending");

    try {
      const res = await fetch(CONTACT_FORM_SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          turnstile_token: verificationToken,
          website: text("website"),
          source_url: window.location.pathname + window.location.search,
          nome,
          email,
          empresa: "",
          cargo: "",
          tema: `The Board · acesso antecipado · ${chosen.name} (${chosen.price})`,
          mensagem: [
            `Investido hoje: ${wealth}`,
            `Como decide: ${how}`,
            thesis ? `Decisão que levaria ao conselho: ${thesis}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        }),
      });
      const raw = await res.text();
      const parsed: { ok?: boolean } = raw ? JSON.parse(raw) : {};
      if (!res.ok || parsed.ok !== true) throw new Error("request_failed");

      pushDataLayerEvent("board_form_submit", { offer, wealth_range: wealth, decides_how: how });
      setStatus("success");
      setRequestId(crypto.randomUUID());
      form.reset();
    } catch {
      setStatus("error");
    } finally {
      setVerificationToken("");
      setVerificationReset(v => v + 1);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO title={b.meta.title} description={b.meta.description} />

      {/* Hero */}
      <section className="bg-[#0b141e] pt-32 pb-20 text-white md:pt-40 md:pb-28">
        <div className={sectionLayout.container}>
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{b.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">{b.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">{b.heroText}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-accent px-7 py-5 text-base font-semibold text-accent-foreground hover:bg-accent/85"
              >
                <a href="#precos" onClick={() => goToForm("hero")}>
                  {b.primaryCta}
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-fit border border-white/60 bg-transparent px-7 py-5 text-base font-medium text-white hover:bg-white/10"
              >
                <a href="#video">{b.secondaryCta}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product video */}
      <section id="video" className="scroll-mt-20 border-b border-border/60 bg-[#f7f4ee] py-16 md:py-24">
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-14">
            <div>
              <h2 className={sectionLayout.title}>{b.videoTitle}</h2>
              <p className="mt-5 text-base leading-[1.75] text-foreground/85 md:text-[17px]">{b.videoText}</p>
            </div>
            <ProductVideo
              src="/videos/board-produto.mp4"
              poster="/videos/board-produto-poster.webp"
              label={b.videoLabel}
              durationLabel={b.videoDuration}
              analyticsId="board"
            />
          </div>
        </div>
      </section>

      {/* The pain */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <h2 className={sectionLayout.title}>{b.painTitle}</h2>
            <div className="space-y-5">
              {b.painParagraphs.map((p) => (
                <p key={p} className="text-base leading-[1.75] text-foreground/85 md:text-[17px]">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
        <div className={sectionLayout.container}>
          <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{b.stepsTitle}</h2>
          <ol className="grid gap-6 md:grid-cols-4 md:gap-8">
            {b.steps.map((step, i) => (
              <li key={step.title} className="border-t border-border pt-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-3 font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 md:mt-20">
            <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{b.councilTitle}</h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{b.councilIntro}</p>
            <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {b.council.map((c, i) => (
                <li
                  key={c.name}
                  className={`flex items-center gap-4 bg-card p-5 ${
                    i === b.council.length - 1 ? "sm:col-span-2" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                    aria-hidden
                  >
                    {c.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.lens}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What it is / is not */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{b.isTitle}</h2>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{b.isLabel}</p>
              <ul className="mt-5 space-y-4">
                {b.isItems.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-700">{b.isNotLabel}</p>
              <ul className="mt-5 space-y-4">
                {b.isNotItems.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (demand test: buttons lead to the access list) */}
      <section id="precos" className={`${sectionLayout.sectionY} scroll-mt-20 bg-[#0b141e] text-white`}>
        <div className={sectionLayout.container}>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{b.pricingTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">{b.pricingIntro}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            {boardOffers.map((o) => (
              <div
                key={o.id}
                className={`flex flex-col rounded-2xl p-6 ring-1 md:p-8 ${
                  o.highlight ? "bg-white/[0.08] ring-accent/70" : "bg-white/[0.04] ring-white/10"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">{o.name}</p>
                <p className="mt-4 text-5xl font-semibold tracking-tight">{o.price}</p>
                <p className="mt-2 text-sm text-white/65">{o.unit}</p>
                <p className="mt-5 text-[15px] leading-relaxed text-white/80">{o.detail}</p>
                <ul className="mt-5 space-y-2.5">
                  {o.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm text-white/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={() => chooseOffer(o.id)}
                  className={`mt-8 w-full py-5 text-base font-semibold ${
                    o.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent/85"
                      : "border border-white/60 bg-transparent text-white hover:bg-white/10"
                  }`}
                >
                  {o.cta}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/60">{b.pricingNote}</p>
        </div>
      </section>

      {/* Access-list form */}
      <section id="acesso" className={`${sectionLayout.sectionY} scroll-mt-20 bg-background`}>
        <div className={`${sectionLayout.container} grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16`}>
          <div>
            <h2 className={sectionLayout.title}>{b.formTitle}</h2>
            <p className={sectionLayout.subtitle}>{b.formIntro}</p>
          </div>

          {status === "success" ? (
            <div className="rounded-2xl border border-border bg-muted/[0.28] p-8" role="status">
              <p className="text-xl font-semibold text-foreground">{b.form.successTitle}</p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{b.form.successText}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} onFocus={onFormFocus} noValidate className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">{b.form.offer}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {boardOffers.map((o) => (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${
                        offer === o.id ? "border-primary bg-primary/[0.06]" : "border-input"
                      }`}
                    >
                      <input
                        type="radio"
                        name="oferta"
                        value={o.id}
                        checked={offer === o.id}
                        onChange={() => setOffer(o.id)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      <span>
                        <span className="font-semibold text-foreground">{o.name}</span>
                        <span className="text-muted-foreground"> · {o.price}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="board-nome">{b.form.name}</Label>
                  <Input id="board-nome" name="nome" autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-email">{b.form.email}</Label>
                  <Input id="board-email" name="email" type="email" autoComplete="email" required />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="board-patrimonio">{b.form.wealth}</Label>
                  <select id="board-patrimonio" name="patrimonio" defaultValue="" required className={selectClass}>
                    <option value="" disabled>
                      {b.form.select}
                    </option>
                    {b.form.wealthOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-como">{b.form.how}</Label>
                  <select id="board-como" name="como_decide" defaultValue="" required className={selectClass}>
                    <option value="" disabled>
                      {b.form.select}
                    </option>
                    {b.form.howOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-tese">{b.form.thesis}</Label>
                <Textarea id="board-tese" name="tese" rows={3} maxLength={600} placeholder={b.form.thesisPlaceholder} />
              </div>

              {/* Honeypot */}
              <div className="hidden" aria-hidden>
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              {(status === "invalid" || status === "error") && (
                <p className="text-sm text-red-600" role="alert">
                  {status === "invalid" ? b.form.invalid : b.form.error}
                </p>
              )}

              <ContactVerification onToken={setVerificationToken} resetKey={verificationReset} />

              <Button
                type="submit"
                size="lg"
                disabled={status === "sending" || !verificationToken}
                className="bg-accent px-8 py-5 text-base font-semibold text-accent-foreground hover:bg-accent/85"
              >
                {status === "sending" ? b.form.sending : b.form.submit}
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {b.form.consentBefore}
                <Link to={localizedPath("privacy", "pt")} className="underline underline-offset-2">
                  {b.form.consentLink}
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
        <div className={sectionLayout.container}>
          <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{b.faqTitle}</h2>
          <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {b.faq.map((item) => (
              <div key={item.q} className="border-t border-border pt-5">
                <dt className="font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={`${sectionLayout.container} ${sectionLayout.prose} mx-auto text-center`}>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl">{b.finalTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">{b.finalText}</p>
          <Button
            size="lg"
            asChild
            className="mt-10 bg-accent px-8 py-6 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <a href="#precos" onClick={() => goToForm("final")}>
              {b.finalCta}
            </a>
          </Button>
          <p className="mx-auto mt-12 max-w-2xl text-xs leading-relaxed text-muted-foreground">{b.disclaimer}</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
