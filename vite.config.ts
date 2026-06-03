import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const contactUrl = env.VITE_CONTACT_FORM_URL?.trim();

  const devProxy =
    mode === "development" && contactUrl
      ? {
          "/api/contact": {
            target: new URL(contactUrl).origin,
            changeOrigin: true,
            secure: true,
            rewrite: () => new URL(contactUrl).pathname + new URL(contactUrl).search,
          },
          "/api/content": {
            target: new URL(contactUrl).origin,
            changeOrigin: true,
            secure: true,
            rewrite: (pathName: string) => {
              const requestUrl = new URL(pathName, "http://local");
              const upstreamUrl = new URL(contactUrl);
              const type = requestUrl.searchParams.get("type");
              if (type === "articles") {
                upstreamUrl.searchParams.set("action", "articles_csv");
              } else if (type === "media") {
                upstreamUrl.searchParams.set("action", "media_csv");
              }
              return upstreamUrl.pathname + upstreamUrl.search;
            },
          },
        }
      : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
      ...(devProxy ? { proxy: devProxy } : {}),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
