import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Instagram, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contato() {
  const { lang } = useLanguage();
  const c = content[lang].contactPage;
  const footer = content[lang].footer;
  const { toast } = useToast();
  const [topic, setTopic] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nome = String(fd.get("nome") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const empresa = String(fd.get("empresa") ?? "").trim();
    const cargo = String(fd.get("cargo") ?? "").trim();
    const mensagem = String(fd.get("mensagem") ?? "").trim();
    const topicLabel =
      c.topicOptions.find((o) => o.value === topic)?.label ?? topic;

    if (!nome || !email || !topic) {
      toast({
        title: lang === "pt" ? "Campos obrigatórios" : "Required fields",
        description:
          lang === "pt"
            ? "Preencha nome, email e o tema da conversa."
            : "Please fill in name, email, and topic.",
        variant: "destructive",
      });
      return;
    }

    const subject =
      lang === "pt" ? `Contato — ${topicLabel}` : `Contact — ${topicLabel}`;
    const body = [
      `${c.form.name}: ${nome}`,
      `${c.form.email}: ${email}`,
      `${c.form.company}: ${empresa}`,
      `${c.form.role}: ${cargo}`,
      `${c.form.topic}: ${topicLabel}`,
      "",
      `${c.form.message}:`,
      mensagem,
    ].join("\n");

    const mailto = `mailto:${footer.contact}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast({
      title:
        lang === "pt" ? "Abrindo o email" : "Opening your email",
      description:
        lang === "pt"
          ? "Se nada abrir, envie para contato@caldeiragrowth.com."
          : "If nothing opens, email contato@caldeiragrowth.com.",
    });
  };

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 md:pb-32 px-4">
        <div className="container mx-auto max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {c.headline}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {c.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">{c.form.name}</Label>
              <Input id="nome" name="nome" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{c.form.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">{c.form.company}</Label>
              <Input id="empresa" name="empresa" autoComplete="organization" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">{c.form.role}</Label>
              <Input id="cargo" name="cargo" autoComplete="organization-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tema">{c.form.topic}</Label>
              <Select value={topic || undefined} onValueChange={setTopic}>
                <SelectTrigger id="tema" aria-label={c.form.topic}>
                  <SelectValue placeholder={c.form.topicPlaceholder} />
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
              <Label htmlFor="mensagem">{c.form.message}</Label>
              <Textarea
                id="mensagem"
                name="mensagem"
                rows={5}
                className="resize-y min-h-[120px]"
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              {c.form.submit}
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
      </section>
      <Footer />
    </main>
  );
}
