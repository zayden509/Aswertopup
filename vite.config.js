import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { SEO_PAGES } from "./seoPages.js";

const SITE = "https://www.awenstopup.com";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Yon kopi index.html pou chak paj Google (dist/recharge/<slug>/index.html), ak pwòp tit li,
// deskripsyon l ak adrès li. Sit la menm (React) se menm nan: li louvri pwodwi a.
function seoPages() {
  return {
    name: "awens-seo-pages",
    apply: "build",
    writeBundle(options) {
      const dir = options.dir || "dist";
      const html = readFileSync(join(dir, "index.html"), "utf8");
      const write = (file, source) => {
        mkdirSync(join(dir, file, ".."), { recursive: true });
        writeFileSync(join(dir, file), source);
      };
      for (const p of SEO_PAGES) {
        const url = `${SITE}/recharge/${p.slug}`;
        const out = html
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
          .replace("<!--seo-->", `<h1 style="margin:0;font:700 18px/1.3 system-ui,sans-serif;text-align:center;padding:0 16px" class="text-slate-700 dark:text-slate-200">Recharge ${esc(p.name)} en Haïti</h1><p style="margin:0;font:14px/1.4 system-ui,sans-serif;text-align:center;padding:0 16px;color:#64748b">${esc(p.description)}</p>`);
        write(`recharge/${p.slug}/index.html`, out);
      }
      // sitemap.xml ak tout paj yo
      const urls = [`${SITE}/`, ...SEO_PAGES.map((p) => `${SITE}/recharge/${p.slug}`)];
      write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u, i) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>${i ? "weekly" : "daily"}</changefreq>\n    <priority>${i ? "0.8" : "1.0"}</priority>\n  </url>`).join("\n")}\n</urlset>\n`);
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPages()],
  // Firebase se yon gwo fichye apa, ki chaje sèlman lè baz done a konfigire
  build: { chunkSizeWarningLimit: 800 },
});
