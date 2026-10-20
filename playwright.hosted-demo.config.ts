import { defineConfig } from "@playwright/test";
import demo from "./playwright.demo.config";

export default defineConfig({
  ...demo,
  use: { ...demo.use, baseURL: "http://localhost:3105" },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3105",
    url: "http://localhost:3105/dashboard",
    reuseExistingServer: false,
    env: {
      // Empty overrides prevent the ignored .env.local file from supplying
      // credentials or the demo opt-in. Vercel sets VERCEL automatically.
      SALONSYS_DEMO_MODE: "",
      VERCEL: "1",
      NEXT_PUBLIC_SITE_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
  },
});
