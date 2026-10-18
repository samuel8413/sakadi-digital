import { SERVICE_PLACEHOLDER } from './schema/site-config.schema.ts';

/**
 * Contact links. Every call to action on the page ends in one of these: the
 * site has no forms and no backend, so a pre-filled WhatsApp message (or an
 * email with a subject) is how a visitor starts a quote.
 */

/** In-page anchor of the contact section; the fallback when no channel is configured. */
export const CONTACT_ANCHOR = 'contacto';

export interface ContactChannels {
  /** Digits only, with country code. */
  readonly whatsapp?: string;
  readonly email?: string;
}

/** `wa.me` is WhatsApp's official click-to-chat link; it works on mobile and desktop. */
export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function mailtoHref(address: string, subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${address}?${params.join('&')}`;
}

/** WhatsApp first (it is how small businesses in Mexico prefer to talk), then email, then the contact section. */
export function inquiryHref(channels: ContactChannels, message: string, subject: string): string {
  if (channels.whatsapp) return whatsappHref(channels.whatsapp, message);
  if (channels.email) return mailtoHref(channels.email, subject, message);
  return `#${CONTACT_ANCHOR}`;
}

export function fillServiceMessage(template: string, serviceName: string): string {
  return template.replaceAll(SERVICE_PLACEHOLDER, serviceName);
}

/**
 * Readable form of a stored number. Mexican numbers (52 + 10 digits) are
 * grouped the way they are written locally: two-digit area codes (CDMX,
 * Guadalajara, Monterrey) as "+52 55 1234 5678", the rest as
 * "+52 222 123 4567". Anything else is shown as "+<digits>" rather than
 * guessing another country's grouping.
 */
export function formatPhone(digits: string): string {
  const metro = /^52(55|33|81)(\d{4})(\d{4})$/.exec(digits);
  if (metro) return `+52 ${metro[1]} ${metro[2]} ${metro[3]}`;
  const regional = /^52(\d{3})(\d{3})(\d{4})$/.exec(digits);
  if (regional) return `+52 ${regional[1]} ${regional[2]} ${regional[3]}`;
  return `+${digits}`;
}
