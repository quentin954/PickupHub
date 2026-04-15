import * as cheerio from 'cheerio';
import type { ParsedPackageData } from '../types/email-parser.types';
import { calculateExpiry } from '../utils/email-parser.utils';

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';
const TABLE_SELECTOR = 'table[role="prise en charge"]';

export const parseMondialRelayEmail = (html: string): ParsedPackageData => {
  const $ = cheerio.load(html);

  const retrievalCode = $('h4').first().nextAll(TABLE_SELECTOR).first().text().trim() || undefined;

  let lockerName: string | undefined = undefined;
  let lockerAddress: string | undefined = undefined;
  let lockerPostalCode: string | undefined = undefined;
  let lockerCity: string | undefined = undefined;

  const jsonLdScript = $(JSON_LD_SELECTOR).html();
  if (jsonLdScript) {
    try {
      const cleanedJson = jsonLdScript.replace(/,(?=\s*[\}\]])/g, '');
      const jsonLd = JSON.parse(cleanedJson);
      if (jsonLd && jsonLd.deliveryAddress) {
        lockerName = jsonLd.deliveryAddress.name;
        lockerAddress = jsonLd.deliveryAddress.streetAddress;
        lockerCity = jsonLd.deliveryAddress.addressLocality;
        lockerPostalCode = jsonLd.deliveryAddress.postalCode;
      }
    } catch (e) {
      console.error('Failed to parse JSON-LD from Mondial Relay email:', e);
    }
  }

  if (!retrievalCode && !lockerName) {
    return { expiryDate: calculateExpiry('mondial-relay') };
  }

  const result: ParsedPackageData = {
    expiryDate: calculateExpiry('mondial-relay'),
  };

  if (retrievalCode) result.retrievalCode = retrievalCode;
  if (lockerName) result.lockerName = lockerName;
  if (lockerAddress) result.lockerAddress = lockerAddress;
  if (lockerPostalCode) result.lockerPostalCode = lockerPostalCode;
  if (lockerCity) result.lockerCity = lockerCity;

  return result;
};