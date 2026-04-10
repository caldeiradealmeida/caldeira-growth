import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

export default function PathToGrow() {
  const { lang } = useLanguage();
  const p = content[lang].pillars.pathToGrow;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 md:pb-32 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {p.title}
          </h1>
          <p className="mt-4 text-sm font-medium text-muted-foreground tracking-wide">
            {p.micro}
          </p>
          <p className="mt-10 text-lg text-foreground/90 leading-relaxed">
            {p.description}
          </p>
          <Button
            size="lg"
            asChild
            className="mt-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            <Link to="/contato">
              {lang === "pt" ? "Falar sobre o programa" : "Discuss the program"}
            </Link>
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
