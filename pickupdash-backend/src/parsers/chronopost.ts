import * as cheerio from 'cheerio';
import type { ParsedPackageData } from '../types/email-parser.types';
import { calculateExpiry, extractQrCodeFromImg, parseAddressLines, parsePostalCodeAndCity } from '../utils/email-parser.utils';

const QR_CODE_SELECTOR = 'img[alt="QR code"]';
const RETRIEVAL_CODE_SELECTOR = 'td:contains("Code de retrait")';
const ARROW_SELECTOR = 'img[alt="Flèche"]';

export const parseChronopostEmail = (html: string): ParsedPackageData => {
  const $ = cheerio.load(html);

  const qrCodeData = extractQrCodeFromImg($, QR_CODE_SELECTOR);
  const retrievalCode = $(RETRIEVAL_CODE_SELECTOR).find('span').text().trim() || undefined;

  if (!qrCodeData && !retrievalCode) {
    return { expiryDate: calculateExpiry('chronopost') };
  }

  const lockerInfoTd = $(ARROW_SELECTOR).closest('td').next();
  const lockerName = lockerInfoTd.find('strong').first().text().trim() || undefined;
  const addressHtml = lockerInfoTd.html() ?? '';
  const addressLines = parseAddressLines(addressHtml);

  let lockerAddress: string | undefined = undefined;
  let lockerPostalCode: string | undefined = undefined;
  let lockerCity: string | undefined = undefined;

  if (addressLines.length >= 3) {
    lockerAddress = addressLines[1];
    const thirdLine = addressLines[2];
    if (thirdLine) {
      const parsed = parsePostalCodeAndCity(thirdLine);
      if (parsed) {
        lockerPostalCode = parsed.postalCode;
        lockerCity = parsed.city;
      }
    }
  }

  const result: ParsedPackageData = {
    expiryDate: calculateExpiry('chronopost'),
  };

  if (qrCodeData) result.qrCodeData = qrCodeData;
  if (retrievalCode) result.retrievalCode = retrievalCode;
  if (lockerName) result.lockerName = lockerName;
  if (lockerAddress) result.lockerAddress = lockerAddress;
  if (lockerPostalCode) result.lockerPostalCode = lockerPostalCode;
  if (lockerCity) result.lockerCity = lockerCity;

  return result;
};