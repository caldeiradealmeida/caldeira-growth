import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import GrowthApproachSection from "@/components/home/GrowthApproachSection";
import DecisionsSection from "@/components/home/DecisionsSection";
import BoardSection from "@/components/home/BoardSection";
import PillarsSection from "@/components/home/PillarsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
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
      <DecisionsSection />
      <BoardSection />
      <PillarsSection emphasis="subtle" />
      <TestimonialsSection />
      <MediaSection />
      <FeaturedArticles />
      <ContactCTA />
      <Footer />
    </main>
  );
}
