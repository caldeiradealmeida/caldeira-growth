import Hero from "@/components/Hero";
import About from "@/components/About";
import RegistrationForm from "@/components/RegistrationForm";
import AuthorClosing from "@/components/AuthorClosing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <AuthorClosing />
      <RegistrationForm />
      <Footer />
    </main>
  );
};

export default Index;
