import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { bookSiteLinkProps } from "@/constants/book";
import denisWithBook from "@/assets/denis/book-denis.jpeg";

export default function Livro() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-center">
            <div className="md:col-span-5 order-2 md:order-1">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Cresça ou Desapareça
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Estratégias e práticas para gestores e empreendedores crescerem
                seus negócios.
              </p>
              <p className="mt-4 text-muted-foreground">
                Por Denis Caldeira de Almeida
              </p>
              <Button
                size="lg"
                asChild
                className="mt-10 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6"
              >
                <a {...bookSiteLinkProps}>Site do livro</a>
              </Button>
            </div>
            <div className="md:col-span-7 order-1 md:order-2">
              <div className="aspect-[4/5] md:aspect-[4/3] max-w-xl overflow-hidden">
                <img
                  src={denisWithBook}
                  alt="Denis Caldeira segurando o livro Cresça ou Desapareça"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
