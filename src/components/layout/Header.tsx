import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import logo from "@/assets/brand/Black logo - no background.svg";
import { bookSiteLinkProps } from "@/constants/book";

type NavKey = keyof typeof content.pt.nav;

type NavItem =
  | { key: Exclude<NavKey, "book">; href: string }
  | { key: "book" };

const navLinks: NavItem[] = [
  { key: "consulting", href: "/consultoria" },
  { key: "speaking", href: "/palestras" },
  { key: "book" },
  { key: "articles", href: "/artigos" },
  { key: "media", href: "/midia" },
  { key: "contact", href: "/contato" },
];

export default function Header() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const c = content[lang].nav;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-8 pl-2">
          {/* Logo — SVG, autoridade de marca */}
          <Link to="/" className="shrink-0 flex items-center pl-1" aria-label="Caldeira Growth - Home">
            <img src={logo} alt="Caldeira Growth" className="h-11 md:h-14 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) =>
              item.key === "book" ? (
                <a
                  key="book"
                  {...bookSiteLinkProps}
                  className="px-3 py-2 text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  {c.book}
                </a>
              ) : (
                <Link
                  key={item.key}
                  to={item.href}
                  className="px-3 py-2 text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  {c[item.key]}
                </Link>
              )
            )}
          </nav>

          {/* Language + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setLang("pt")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  lang === "pt"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                PT
              </button>
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors border-l border-border",
                  lang === "en"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="md:hidden py-4 border-t border-border animate-in fade-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((item) =>
                item.key === "book" ? (
                  <a
                    key="book"
                    {...bookSiteLinkProps}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    {c.book}
                  </a>
                ) : (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    {c[item.key]}
                  </Link>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
