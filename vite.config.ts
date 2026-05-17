import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Pure SPA build — no SSR, no Cloudflare Workers. Deploys to Vercel as static site.
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ],
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
