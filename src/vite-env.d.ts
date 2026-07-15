/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_FORM_URL?: string;
  readonly VITE_ARTICLES_SHEET_CSV_URL?: string;
  readonly VITE_MEDIA_SHEET_CSV_URL?: string;
  readonly VITE_ENABLE_SPANISH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
