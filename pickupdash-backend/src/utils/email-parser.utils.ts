import { CARRIER_EXPIRY_DAYS } from '../constants/carriers';
import type { CarrierType } from '../types/email-parser.types';
import * as cheerio from 'cheerio';

export const calculateExpiry = (carrier: CarrierType): Date => {
  const days = CARRIER_EXPIRY_DAYS[carrier] || 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};

export const extractQrCodeFromImg = ($: cheerio.CheerioAPI, selector: string): string | undefined => {
  return $(selector).attr('src') ?? undefined;
};

export const parseAddressLines = (html: string | undefined): string[] => {
  if (!html) return [];
  return html
    .split('<br>')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

export const parsePostalCodeAndCity = (text: string | undefined): { postalCode: string; city: string } | null => {
  if (!text) return null;
  const match = text.match(/(\d{5})\s+(.*)/);
  if (!match) return null;
  const postalCode = match[1];
  const city = match[2];
  if (!postalCode || !city) return null;
  return { postalCode, city };
};