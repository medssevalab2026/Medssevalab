export type CardBrand =
  | 'Visa'
  | 'Mastercard'
  | 'RuPay'
  | 'Amex'
  | 'Diners'
  | 'Maestro'
  | 'Unknown';

interface BrandRule {
  name: CardBrand;
  pattern: RegExp;
  lengths: number[];
  cvvLength: number;
  gaps: number[];
  format: RegExp;
}

const BRAND_RULES: BrandRule[] = [
  {
    name: 'Amex',
    pattern: /^3[47]/,
    lengths: [15],
    cvvLength: 4,
    gaps: [4, 10],
    format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
  },
  {
    name: 'Diners',
    pattern: /^3(?:0[0-5]|[68])/,
    lengths: [14],
    cvvLength: 3,
    gaps: [4, 10],
    format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
  },
  {
    name: 'Maestro',
    pattern: /^(?:50|6[0-9])/,
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    cvvLength: 3,
    gaps: [4, 8, 12],
    format: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,7})?/,
  },
  {
    name: 'RuPay',
    pattern: /^6(?:0|52[1-9]|5[3-9]|[6-9])/,
    lengths: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
    format: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
  },
  {
    name: 'Mastercard',
    pattern: /^(?:5[1-5]|2[2-7])/,
    lengths: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
    format: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
  },
  {
    name: 'Visa',
    pattern: /^4/,
    lengths: [13, 16, 19],
    cvvLength: 3,
    gaps: [4, 8, 12],
    format: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
  },
];

export function detectCardBrand(digits: string): BrandRule & { name: CardBrand } {
  for (const rule of BRAND_RULES) {
    if (rule.pattern.test(digits)) return rule;
  }
  return {
    name: 'Unknown',
    pattern: /^$/,
    lengths: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
    format: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
  };
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(raw: string, brand: BrandRule): string {
  const digits = raw.replace(/\D/g, '');
  const maxLen = Math.max(...brand.lengths);
  const capped = digits.slice(0, maxLen);
  const groups: string[] = [];
  let prev = 0;
  for (const gap of brand.gaps) {
    if (prev >= capped.length) break;
    groups.push(capped.slice(prev, gap));
    prev = gap;
  }
  if (prev < capped.length) groups.push(capped.slice(prev));
  return groups.filter(Boolean).join(' ');
}

export function validateExpiry(expiry: string): {
  valid: boolean;
  error: string | null;
} {
  if (expiry.length < 5) return { valid: false, error: 'Enter expiry as MM/YY' };
  const [mm, yy] = expiry.split('/');
  const month = parseInt(mm, 10);
  const year = parseInt(yy, 10) + 2000;
  if (month < 1 || month > 12) return { valid: false, error: 'Invalid month' };
  const now = new Date();
  const expDate = new Date(year, month - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (expDate < thisMonth) return { valid: false, error: 'Card has expired' };
  return { valid: true, error: null };
}

export function validateHolder(name: string): {
  valid: boolean;
  error: string | null;
} {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Card holder name is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Name is too short' };
  if (!/^[a-zA-Z\s.\-']+$/.test(trimmed)) {
    return { valid: false, error: 'Name must contain only letters' };
  }
  if (/^\d+$/.test(trimmed)) return { valid: false, error: 'Name cannot be only numbers' };
  return { valid: true, error: null };
}

export const BRAND_COLORS: Record<CardBrand, [string, string]> = {
  Visa: ['#1A1F71', '#2E3A8C'],
  Mastercard: ['#EB001B', '#F79E1B'],
  RuPay: ['#006A4E', '#00875A'],
  Amex: ['#2E77BC', '#1A4E8A'],
  Diners: ['#004A97', '#0062CC'],
  Maestro: ['#CC0000', '#FF5F00'],
  Unknown: ['#1E293B', '#475569'],
};

export const BRAND_ICONS: Record<CardBrand, string> = {
  Visa: 'V',
  Mastercard: 'MC',
  RuPay: 'RuPay',
  Amex: 'AMEX',
  Diners: 'DC',
  Maestro: 'M',
  Unknown: '••',
};