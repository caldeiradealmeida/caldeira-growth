import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import GrowthApproachSection from "@/components/home/GrowthApproachSection";
import EditorialQuote from "@/components/home/EditorialQuote";
import DecisionsSection from "@/components/home/DecisionsSection";
import PillarsSection from "@/components/home/PillarsSection";
import BoardSection from "@/components/home/BoardSection";
import MediaSection from "@/components/home/MediaSection";
import FeaturedArticles from "@/components/home/FeaturedArticles";
import ContactCTA from "@/components/home/ContactCTA";

export default function Index() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection />
      <GrowthApproachSection />
      <EditorialQuote
        quote="Denis traz clareza ao analisar cenários complexos e traduz isso em direcionamento prático."
        attribution="— Fabio Kadi, Sócio Diretor, Kadi Advogados"
      />
      <DecisionsSection />
      <EditorialQuote
        quote="Sua capacidade de conectar diferentes áreas e provocar decisões estratégicas foi um diferencial claro."
        attribution="— Alessandro Pacanowski, CEO, Roda Conveniência"
      />
      <PillarsSection emphasis="subtle" />
      <BoardSection />
      <MediaSection />
      <FeaturedArticles />
      <ContactCTA />
      <Footer />
    </main>
  );
}
