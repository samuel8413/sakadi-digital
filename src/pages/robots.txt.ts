import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../seo/robots.ts';

/**
 * Generated at build time so the sitemap URL always matches `site` + `base`.
 * Note: crawlers only read robots.txt at the domain root, so this file is
 * effective for user/organisation Pages (`<user>.github.io`) or a custom
 * domain. For project Pages (`<user>.github.io/<repo>/`) it is harmless but ignored.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(buildRobotsTxt(site, import.meta.env.BASE_URL), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
