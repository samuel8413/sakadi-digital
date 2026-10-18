import { describe, expect, it } from 'vitest';
import { normalizeLanding, splitParagraphs } from '../../src/domain/normalize.ts';
import { parseCatalog, parseConfig } from '../fixtures/content.ts';

describe('normalizeLanding', () => {
  const landing = normalizeLanding(parseCatalog(), parseConfig());

  it('prefixes anchors so offerings never collide with section ids', () => {
    expect(landing.services[0]!.anchor).toBe('servicio-landing');
    expect(landing.maintenance.plans[0]!.anchor).toBe('plan-basico');
    expect(landing.subscription.packages[0]!.anchor).toBe('paquete-landing-suscripcion');
  });

  it('resolves guide recommendations and required plans to in-page links', () => {
    expect(landing.guide.items[0]!.recommendations.map((r) => r.anchor)).toEqual([
      'servicio-landing',
      'plan-basico',
    ]);
    expect(landing.services[0]!.requiredPlan).toEqual({
      id: 'basico',
      name: 'Plan basico',
      anchor: 'plan-basico',
    });
  });

  it('turns plan tables into one feature list per plan', () => {
    const [basico, pro] = landing.maintenance.plans;
    expect(basico!.features).toEqual([{ label: 'Hosting', value: true }]);
    expect(pro!.features).toEqual([{ label: 'Hosting', value: 'Dedicado' }]);
  });

  it('names each offering in its WhatsApp message', () => {
    const href = decodeURIComponent(landing.services[0]!.inquiryHref);
    expect(href).toBe('https://wa.me/525512345678?text=Hola, me interesa Landing.');
    expect(landing.contact.whatsapp?.display).toBe('+52 55 1234 5678');
  });

  it('falls back to email and then to the contact section when channels are missing', () => {
    const emailOnly = normalizeLanding(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, whatsapp: '' } })),
    );
    expect(emailOnly.services[0]!.inquiryHref).toMatch(/^mailto:hola@acme\.mx\?subject=/);
    expect(emailOnly.contact.whatsapp).toBeUndefined();

    const none = normalizeLanding(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, whatsapp: '', email: '' } })),
    );
    expect(none.contact.inquiryHref).toBe('#contacto');
    expect(none.contact.email).toBeUndefined();
  });

  it('drops every price and the pricing note when prices are hidden', () => {
    const hidden = normalizeLanding(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, pricing: { ...raw.pricing, display: 'hidden' } })),
    );
    expect(hidden.pricingNote).toBeUndefined();
    expect(hidden.services[0]!.price).toBeUndefined();
    expect(hidden.addons.items[0]!.price).toBeUndefined();
    expect(hidden.seo.audit.price).toBeUndefined();
  });

  it('lists only the social networks that are configured, in a fixed order', () => {
    const social = normalizeLanding(
      parseCatalog(),
      parseConfig((raw) => ({
        ...raw,
        social: { instagram: 'https://instagram.com/acme', facebook: 'https://fb.com/acme' },
      })),
    ).business.social;
    expect(social.map((s) => s.network)).toEqual(['facebook', 'instagram']);
  });

  it('splits FAQ answers into paragraphs and joins soft line breaks', () => {
    expect(landing.faq[0]!.answer).toEqual(['No.', 'Son de referencia.']);
    expect(splitParagraphs('A\n\n\n\nB\nC\n')).toEqual(['A', 'B C']);
  });
});
