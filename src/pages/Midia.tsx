import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MediaSection from "@/components/home/MediaSection";

export default function Midia() {
  return (
    <main className="min-h-screen">
      <Header />
      <MediaSection variant="page" />
      <Footer />
    </main>
  );
}
