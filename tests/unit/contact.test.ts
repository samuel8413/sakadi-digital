import { describe, expect, it } from 'vitest';
import {
  CONTACT_ANCHOR,
  fillServiceMessage,
  formatPhone,
  inquiryHref,
  mailtoHref,
  whatsappHref,
} from '../../src/domain/contact.ts';

describe('contact links', () => {
  it('builds a click-to-chat link with an encoded message', () => {
    expect(whatsappHref('525512345678', 'Hola, ¿precio?')).toBe(
      'https://wa.me/525512345678?text=Hola%2C%20%C2%BFprecio%3F',
    );
  });

  it('builds a mailto with subject and optional body', () => {
    expect(mailtoHref('a@b.mx', 'Cotización')).toBe('mailto:a@b.mx?subject=Cotizaci%C3%B3n');
    expect(mailtoHref('a@b.mx', 'S', 'B y C')).toBe('mailto:a@b.mx?subject=S&body=B%20y%20C');
  });

  it('prefers WhatsApp, then email, then the contact section', () => {
    expect(inquiryHref({ whatsapp: '52', email: 'a@b.mx' }, 'm', 's')).toMatch(/^https:\/\/wa\.me/);
    expect(inquiryHref({ email: 'a@b.mx' }, 'm', 's')).toMatch(/^mailto:/);
    expect(inquiryHref({}, 'm', 's')).toBe(`#${CONTACT_ANCHOR}`);
  });

  it('names the service in the message template', () => {
    expect(fillServiceMessage('Me interesa {servicio}.', 'SEO Local')).toBe(
      'Me interesa SEO Local.',
    );
  });
});

describe('formatPhone', () => {
  it('groups Mexican numbers the way they are written locally', () => {
    expect(formatPhone('525512345678')).toBe('+52 55 1234 5678');
    expect(formatPhone('523312345678')).toBe('+52 33 1234 5678');
    expect(formatPhone('522221234567')).toBe('+52 222 123 4567');
  });

  it('does not guess other countries', () => {
    expect(formatPhone('14155552671')).toBe('+14155552671');
  });
});
