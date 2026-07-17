/**
 * Formulário de contato → Google Sheets via Apps Script.
 *
 * A URL do endpoint vem de VITE_CONTACT_FORM_URL (veja src/constants/contactForm.ts).
 * Após alterar .env, reinicie `npm run dev`. No deploy (Vercel), defina a mesma variável
 * e faça redeploy.
 */
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { SOCIAL_LINKS } from "@/constants/social";
import {
  CONTACT_FORM_SUBMIT_URL,
  isContactFormConfigured,
} from "@/constants/contactForm";
import { sectionLayout } from "@/lib/sectionLayout";
import {
  Instagram,
  Linkedin,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Contato() {
  const { lang } = useLanguage();
  const c = content[lang].contactPage;
  const footer = content[lang].footer;
  const f = c.form;
  const { toast } = useToast();
  const [topic, setTopic] = useState<string>("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const formReady = isContactFormConfigured();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nome = String(fd.get("nome") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const empresa = String(fd.get("empresa") ?? "").trim();
    const cargo = String(fd.get("cargo") ?? "").trim();
    const mensagem = String(fd.get("mensagem") ?? "").trim();
    const topicLabel =
      c.topicOptions.find((o) => o.value === topic)?.label ?? topic;

    if (!nome || !email || !topic || mensagem.length < 20) {
      toast({
        title:
          lang === "pt"
            ? "Campos obrigatórios"
            : lang === "en"
              ? "Required fields"
              : "Campos obligatorios",
        description:
          lang === "pt"
            ? "Preencha nome, e-mail, tema e uma mensagem com pelo menos 20 caracteres."
            : lang === "en"
              ? "Please fill in name, email, topic, and a message with at least 20 characters."
              : "Complete nombre, email, tema y un mensaje con al menos 20 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!formReady) {
      return;
    }

    setStatus("loading");

    const payload = JSON.stringify({
      nome,
      email,
      empresa,
      cargo,
      tema: topicLabel,
      mensagem,
    });

    try {
      const res = await fetch(CONTACT_FORM_SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        if (import.meta.env.DEV) {
          console.error(
            "[Caldeira contact form] Resposta não é JSON (primeiros 300 caracteres):",
            raw.slice(0, 300)
          );
        }
        throw new Error("invalid_response");
      }

      if (!res.ok || data.ok !== true) {
        if (import.meta.env.DEV) {
          console.error("[Caldeira contact form] Falha upstream", {
            httpStatus: res.status,
            body: data,
          });
        }
        throw new Error(data.error || "request_failed");
      }

      setStatus("success");
      form.reset();
      setTopic("");
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("[Caldeira contact form] Erro no envio", e);
      }
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen">
      <Header />
      <SEO
        routeKey="contact"
        title={
          lang === "pt"
            ? "Contato | Caldeira Growth"
            : lang === "en"
              ? "Contact | Caldeira Growth"
              : "Contacto | Caldeira Growth"
        }
        description={c.subtitle}
      />
      <section className="pt-28 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} max-w-xl`}>
            <h1 className={sectionLayout.title}>{c.headline}</h1>
            <p className={sectionLayout.subtitle}>{c.subtitle}</p>

            {!formReady && (
              <Alert className="mt-8 border-amber-500/30 bg-amber-500/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  {lang === "pt"
                    ? "Configuração"
                    : lang === "en"
                      ? "Configuration"
                      : "Configuración"}
                </AlertTitle>
                <AlertDescription>{f.notConfigured}</AlertDescription>
              </Alert>
            )}

            {status === "success" && (
              <Alert className="mt-8 border-primary/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertTitle>{f.successTitle}</AlertTitle>
                <AlertDescription>{f.successDescription}</AlertDescription>
              </Alert>
            )}

            {status === "error" && formReady && (
              <Alert variant="destructive" className="mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{f.errorTitle}</AlertTitle>
                <AlertDescription>{f.errorDescription}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-12 space-y-6"
              aria-busy={status === "loading"}
            >
              <div className="space-y-2">
                <Label htmlFor="nome">{f.name}</Label>
                <Input id="nome" name="nome" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{f.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">{f.company}</Label>
                <Input
                  id="empresa"
                  name="empresa"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">{f.role}</Label>
                <Input
                  id="cargo"
                  name="cargo"
                  autoComplete="organization-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tema">{f.topic}</Label>
                <Select value={topic || undefined} onValueChange={setTopic}>
                  <SelectTrigger id="tema" aria-label={f.topic}>
                    <SelectValue placeholder={f.topicPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {c.topicOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensagem">{f.message} *</Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  rows={5}
                  required
                  minLength={20}
                  maxLength={1200}
                  placeholder={
                    lang === "pt"
                      ? "Conte brevemente o desafio da sua organização ou o tema que gostaria de discutir."
                      : lang === "en"
                        ? "Briefly describe your organization's challenge or the topic you would like to discuss."
                        : "Describa brevemente el desafío de su organización o el tema que le gustaría discutir."
                  }
                  className="resize-y min-h-[120px]"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={status === "loading" || !formReady}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {f.sending}
                  </>
                ) : (
                  f.submit
                )}
              </Button>
            </form>

            <div className="mt-14 pt-10 border-t border-border/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {footer.connectLabel}
              </p>
              <div className="flex items-center gap-5">
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" strokeWidth={1.5} />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
