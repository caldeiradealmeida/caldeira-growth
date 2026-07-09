import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Consultoria from "./pages/Consultoria";
import Palestras from "./pages/Palestras";
import Livro from "./pages/Livro";
import PathToGrow from "./pages/PathToGrow";
import Artigos from "./pages/Artigos";
import ArticlePage from "./pages/ArticlePage";
import Midia from "./pages/Midia";
import Contato from "./pages/Contato";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Campaign from "./pages/Campaign";
import AmazonRedirect from "./pages/AmazonRedirect";
import Desafio650 from "./pages/Desafio650";
import CGI from "./pages/CGI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/consultoria" element={<Consultoria />} />
            <Route path="/palestras" element={<Palestras />} />
            <Route path="/livro" element={<Livro />} />
            <Route path="/path-to-grow" element={<PathToGrow />} />
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
            <Route path="/650" element={<Desafio650 />} />
            <Route path="/cgi" element={<CGI />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
