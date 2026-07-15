import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getPublicLanguages,
  languageLabels,
  localizedPath,
  switchLanguagePath,
  type Language,
  type RouteKey,
} from "@/lib/routing";
import { navigation } from "@/data/strategicContent";

import logo from "@/assets/brand/Black logo - no background.svg";
import { bookSiteLinkProps } from "@/constants/book";

const mainNav: Array<{ key: keyof typeof navigation.pt; route: RouteKey }> = [
  { key: "home", route: "home" },
  { key: "consulting", route: "consulting" },
  { key: "executiveDevelopment", route: "executiveDevelopment" },
  { key: "speaking", route: "speaking" },
  { key: "about", route: "about" },
  { key: "contact", route: "contact" },
];

export default function Header() {
  const { lang, setLang } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const c = navigation[lang];
  const showContentMenu = lang !== "es";

  const languageHref = (target: Language) =>
    switchLanguagePath(location.pathname, location.search, location.hash, target);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-8 pl-2">
          {/* Logo — SVG, autoridade de marca */}
          <Link
            to={localizedPath("home", lang)}
            className="shrink-0 flex items-center pl-1"
            aria-label="Caldeira Growth - Home"
          >
            <img src={logo} alt="Caldeira Growth" className="h-11 md:h-14 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {mainNav.slice(0, 4).map((item) => (
              <Link
                key={item.route}
                to={localizedPath(item.route, lang)}
                className="px-3 py-2 text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                {c[item.key]}
              </Link>
            ))}
            {showContentMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                  {c.content}
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={localizedPath("content", lang)}>{c.content}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={localizedPath("articles", lang)}>{c.articles}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={localizedPath("media", lang)}>{c.media}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a {...bookSiteLinkProps}>{c.book}</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {mainNav.slice(4).map((item) => (
              <Link
                key={item.route}
                to={localizedPath(item.route, lang)}
                className="px-3 py-2 text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                {c[item.key]}
              </Link>
            ))}
          </nav>

          {/* Language + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-border overflow-hidden">
              {getPublicLanguages().map((language, index) => (
                <Link
                  key={language}
                  to={languageHref(language)}
                  onClick={() => setLang(language)}
                  aria-label={`Change language to ${languageLabels[language]}`}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    index > 0 && "border-l border-border",
                    lang === language
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {languageLabels[language]}
                </Link>
              ))}
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
              {mainNav.slice(0, 4).map((item) => (
                  <Link
                    key={item.route}
                    to={localizedPath(item.route, lang)}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    {c[item.key]}
                  </Link>
              ))}
              {showContentMenu ? (
                <>
                  <Link
                    to={localizedPath("content", lang)}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    {c.content}
                  </Link>
                  <div className="pl-4 flex flex-col border-l border-border/60 ml-4">
                    <Link
                      to={localizedPath("articles", lang)}
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.articles}
                    </Link>
                    <Link
                      to={localizedPath("media", lang)}
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.media}
                    </Link>
                    <a
                      {...bookSiteLinkProps}
                      onClick={(event) => {
                        bookSiteLinkProps.onClick(event);
                        setOpen(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.book}
                    </a>
                  </div>
                </>
              ) : null}
              {mainNav.slice(4).map((item) => (
                <Link
                  key={item.route}
                  to={localizedPath(item.route, lang)}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  {c[item.key]}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
