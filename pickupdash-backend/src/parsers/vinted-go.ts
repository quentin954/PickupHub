import * as cheerio from 'cheerio';
import type { ParsedPackageData } from '../types/email-parser.types';
import { calculateExpiry, extractQrCodeFromImg } from '../utils/email-parser.utils';

const QR_CODE_SELECTOR = 'img[alt="QR code"]';
const LOCKER_INFO_SELECTOR = 'div[style*="background:#F2F3F2"]';

export const parseVintedGoEmail = (html: string): ParsedPackageData => {
  const $ = cheerio.load(html);

  const qrCodeData = extractQrCodeFromImg($, QR_CODE_SELECTOR);

  let retrievalCode: string | undefined = undefined;
  if (qrCodeData) {
    const urlParts = qrCodeData.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart) {
      const codeParts = lastPart.split(':');
      if (codeParts.length > 1) {
        retrievalCode = codeParts[1];
      }
    }
  }

  if (!qrCodeData && !retrievalCode) {
    return { expiryDate: calculateExpiry('vinted-go') };
  }

  const lockerInfoContainer = $(LOCKER_INFO_SELECTOR);
  let lockerName: string | undefined = undefined;
  let lockerAddress: string | undefined = undefined;
  let lockerCity: string | undefined = undefined;

  if (lockerInfoContainer.length > 0) {
    const bTags = lockerInfoContainer.find('b');
    if (bTags.length >= 5) {
      lockerName = $(bTags[2]).text().trim() || undefined;
      lockerAddress = $(bTags[3]).text().trim() || undefined;
      lockerCity = $(bTags[4]).text().trim() || undefined;
    }
  }

  const result: ParsedPackageData = {
    expiryDate: calculateExpiry('vinted-go'),
  };

  if (qrCodeData) result.qrCodeData = qrCodeData;
  if (retrievalCode) result.retrievalCode = retrievalCode;
  if (lockerName) result.lockerName = lockerName;
  if (lockerAddress) result.lockerAddress = lockerAddress;
  if (lockerCity) result.lockerCity = lockerCity;

  return result;
};