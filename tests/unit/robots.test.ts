import { describe, expect, it } from 'vitest';
import { buildRobotsTxt } from '../../src/seo/robots.ts';

describe('buildRobotsTxt', () => {
  it('emits an absolute sitemap URL for a user site', () => {
    expect(buildRobotsTxt(new URL('https://example.github.io'), '/')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.github.io/sitemap-index.xml\n',
    );
  });

  it('keeps the base path of a project site', () => {
    expect(buildRobotsTxt(new URL('https://example.github.io'), '/portfolio/')).toContain(
      'Sitemap: https://example.github.io/portfolio/sitemap-index.xml',
    );
  });

  it('omits the sitemap directive rather than emitting a relative URL', () => {
    const body = buildRobotsTxt(undefined, '/');
    expect(body).toBe('User-agent: *\nAllow: /\n');
    expect(body).not.toContain('Sitemap:');
  });
});
