export interface ParsedPackageData {
  qrCodeData?: string;
  retrievalCode?: string;
  lockerName?: string;
  lockerAddress?: string;
  lockerPostalCode?: string;
  lockerCity?: string;
  expiryDate: Date;
}

export type CarrierType = 'chronopost' | 'mondial-relay' | 'vinted-go';