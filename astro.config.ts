import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { readFileSync } from 'node:fs';

/**
 * Deployment target is resolved from the environment so one config serves:
 *  - local dev/preview          (no env: base "/", no canonical URLs)
 *  - user pages  <u>.github.io  (SITE_URL=https://u.github.io      BASE_PATH=/)
 *  - project pages /<repo>      (SITE_URL=https://u.github.io      BASE_PATH=/repo)
 *  - custom domain              (SITE_URL=https://sakadi.mx         BASE_PATH=/)
 * The deploy workflow feeds both values from `actions/configure-pages`, so a
 * repository rename or custom domain needs no code change.
 */
const localConfig = JSON.parse(
  readFileSync(new URL('./content/site.config.json', import.meta.url), 'utf8'),
) as {
  site?: { url?: string };
};

/** Empty strings mean "not configured", both in env vars and in site.config.json. */
const nonEmpty = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === '' ? undefined : trimmed;
};

const site = nonEmpty(process.env.SITE_URL) ?? nonEmpty(localConfig.site?.url);
/** Normalised to a trailing slash: `configure-pages` emits `/repo`, and the sitemap dedupes cleanly only with `/repo/`. */
const base = (nonEmpty(process.env.BASE_PATH) ?? '/').replace(/\/?$/, '/');

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],

  /**
   * Montserrat is the brand typeface (see the logo). It is self-hosted from the
   * npm package, so the build needs no network and the version is pinned by the
   * lockfile. Astro emits the @font-face rule, a metric-matched fallback (no
   * layout shift while the font loads), a preload link, and registers the
   * style hash with the CSP. Only the Latin subset is shipped: it covers
   * Spanish (á é í ó ú ü ñ ¿ ¡). See ADR 0006.
   */
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
  ],

  image: {
    // Responsive images by default; markup uses data attributes, not inline styles, so CSP stays strict.
    layout: 'constrained',
    responsiveStyles: true,
  },

  // No Markdown is rendered; Shiki's inline styles would also conflict with the CSP.
  markdown: { syntaxHighlight: false },

  build: {
    // Small stylesheets are inlined (fewer requests); Astro hashes them for the CSP.
    inlineStylesheets: 'auto',
  },

  security: {
    /**
     * GitHub Pages cannot send HTTP headers, so the policy ships as a <meta> tag.
     * Astro hashes every script and style it emits (including the font CSS); the
     * single hand-written inline script (theme boot) registers its own hash in
     * BaseLayout. `frame-ancestors`, `report-uri` and `sandbox` are not allowed in
     * meta CSP and are omitted. There are no forms: contact goes through WhatsApp
     * and email links, so `form-action` stays closed.
     */
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
