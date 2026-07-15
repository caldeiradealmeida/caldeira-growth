import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getLanguageFromPath,
  isLanguagePublic,
  STORAGE_KEY,
  type Language,
} from "@/lib/routing";

export type { Language } from "@/lib/routing";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [lang, setLangState] = useState<Language>("pt");

  useEffect(() => {
    const routeLang = getLanguageFromPath(location.pathname);
    setLangState(routeLang);
    try {
      if (isLanguagePublic(routeLang)) {
        localStorage.setItem(STORAGE_KEY, routeLang);
      }
    } catch {
      // ignore
    }
  }, [location.pathname]);

  const setLang = useCallback((value: Language) => {
    setLangState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      // Simple key lookup - components will use content objects directly for type safety
      // This is a fallback for dynamic keys if needed
      return key;
    },
    []
  );

  const value: LanguageContextValue = {
    lang,
    setLang,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
