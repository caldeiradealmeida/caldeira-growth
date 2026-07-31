import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Consultoria from "./pages/Consultoria";
import DesenvolvimentoExecutivo from "./pages/DesenvolvimentoExecutivo";
import Palestras from "./pages/Palestras";
import Livro from "./pages/Livro";
import Conteudo from "./pages/Conteudo";
import Sobre from "./pages/Sobre";
import Artigos from "./pages/Artigos";
import ArticlePage from "./pages/ArticlePage";
import Midia from "./pages/Midia";
import Contato from "./pages/Contato";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Campaign from "./pages/Campaign";
import AmazonRedirect from "./pages/AmazonRedirect";
import CGI from "./pages/CGI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RedirectWithParams({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/consultoria" element={<Consultoria />} />
            <Route
              path="/desenvolvimento-executivo"
              element={<DesenvolvimentoExecutivo />}
            />
            <Route
              path="/path-to-grow"
              element={<RedirectWithParams to="/desenvolvimento-executivo" />}
            />
            <Route path="/palestras" element={<Palestras />} />
            <Route path="/conteudo" element={<Conteudo />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/livro" element={<Livro />} />
            <Route path="/artigos" element={<Artigos />} />
            <Route path="/artigos/:slug" element={<ArticlePage />} />
            <Route path="/midia" element={<Midia />} />
            <Route path="/contato" element={<Contato />} />
            <Route
              path="/politica-de-privacidade"
              element={<PrivacyPolicy />}
            />
            <Route path="/campanha" element={<Campaign />} />
            <Route path="/qr" element={<AmazonRedirect />} />
            <Route path="/amazon" element={<AmazonRedirect />} />
            <Route path="/cgi" element={<CGI />} />

            <Route path="/en" element={<Index />} />
            <Route path="/en/consulting" element={<Consultoria />} />
            <Route
              path="/en/executive-development"
              element={<DesenvolvimentoExecutivo />}
            />
            <Route path="/en/speaking" element={<Palestras />} />
            <Route path="/en/content" element={<Conteudo />} />
            <Route path="/en/about" element={<Sobre />} />
            <Route path="/en/articles" element={<Artigos />} />
            <Route path="/en/articles/:slug" element={<ArticlePage />} />
            <Route path="/en/media" element={<Midia />} />
            <Route path="/en/contact" element={<Contato />} />
            <Route path="/en/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/en/cgi" element={<CGI />} />

            <Route path="/es" element={<Index />} />
            <Route path="/es/consultoria" element={<Consultoria />} />
            <Route
              path="/es/desarrollo-ejecutivo"
              element={<DesenvolvimentoExecutivo />}
            />
            <Route path="/es/conferencias" element={<Palestras />} />
            <Route path="/es/contenidos" element={<Conteudo />} />
            <Route path="/es/sobre-nosotros" element={<Sobre />} />
            <Route path="/es/articulos" element={<Artigos />} />
            <Route path="/es/articulos/:slug" element={<ArticlePage />} />
            <Route path="/es/media" element={<Midia />} />
            <Route path="/es/contacto" element={<Contato />} />
            <Route
              path="/es/politica-de-privacidad"
              element={<PrivacyPolicy />}
            />
            <Route path="/es/cgi" element={<CGI />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
