import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

import logo from "@/assets/brand/Color logo - no background.svg";
import { bookSiteLinkProps } from "@/constants/book";
import { SOCIAL_LINKS } from "@/constants/social";

type NavKey = keyof typeof content.pt.nav;

type FooterNavItem =
  | { key: Exclude<NavKey, "book">; href: string }
  | { key: "book" };

const footerNav: FooterNavItem[] = [
  { key: "consulting", href: "/consultoria" },
  { key: "speaking", href: "/palestras" },
  { key: "book" },
  { key: "articles", href: "/artigos" },
  { key: "media", href: "/midia" },
  { key: "contact", href: "/contato" },
];

export default function Footer() {
  const { lang } = useLanguage();
  const c = content[lang];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img
                  src={logo}
                  alt="Caldeira Growth"
                  className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-primary-foreground/80 text-sm">
                {c.footer.tagline}
              </p>
              <a
                href={`mailto:${c.footer.contact}`}
                className="text-accent hover:text-accent/90 text-sm font-medium transition-colors"
              >
                {c.footer.contact}
              </a>
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70 mb-3">
                  {c.footer.connectLabel}
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-foreground/75 hover:text-primary-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" strokeWidth={1.5} />
                  </a>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-foreground/75 hover:text-primary-foreground transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </div>
            <nav className="flex flex-wrap gap-6">
              {footerNav.map((item) =>
                item.key === "book" ? (
                  <a
                    key="book"
                    {...bookSiteLinkProps}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {c.nav.book}
                  </a>
                ) : (
                  <Link
                    key={item.key}
                    to={item.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {c.nav[item.key]}
                  </Link>
                )
              )}
            </nav>
          </div>
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {year} {c.footer.rights}
            </p>
            <Link
              to="/politica-de-privacidade"
              className="text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors shrink-0"
            >
              {c.footer.privacyPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
