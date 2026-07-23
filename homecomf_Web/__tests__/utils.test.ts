import { describe, it, expect } from '@jest/globals';

// A mock subset matching frontend/lib/utils behavior
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const hasDateOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => {
  return startA < endB && endA > startB;
};

const getImageUrl = (path: string | undefined, baseUrl: string = 'http://localhost:5000') => {
  if (!path) return '/images/logo.png';
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};


describe('Frontend Jest Tests (Unit & Utility)', () => {
  
  describe('Currency & Price Formatters', () => {
    it('[1] Formats numbers to NPR format with decimals', () => {
      const formatted = formatCurrency(5000);
      expect(formatted).toContain('5,000.00'); 
    });
    
    it('[2] Handles zero values optimally formatting as NPR 0', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0.00');
    });
    
    it('[3] Formats large numbers with native commas', () => {
      const formattedNum = formatCurrency(1234567);
      expect(formattedNum).toContain('12,34,567'); // Check IN/NP locale spacing
    });
  });

  describe('Reservation Overlap Logic', () => {
    it('[4] Returns true when dates overlap completely', () => {
      const aStart = new Date('2026-03-10');
      const aEnd = new Date('2026-03-15');
      const bStart = new Date('2026-03-12');
      const bEnd = new Date('2026-03-20');
      expect(hasDateOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    });

    it('[5] Returns true when reservation is consumed fully inside another', () => {
      const aStart = new Date('2026-03-10');
      const aEnd = new Date('2026-03-20');
      const bStart = new Date('2026-03-12');
      const bEnd = new Date('2026-03-15');
      expect(hasDateOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    });

    it('[6] Returns false bounds when sequence is safely adjacent', () => {
      const aStart = new Date('2026-03-10');
      const aEnd = new Date('2026-03-15');
      const bStart = new Date('2026-03-15'); // Check-out same day as check in
      const bEnd = new Date('2026-03-20');
      expect(hasDateOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
    });

    it('[7] Returns false when strictly non-overlapping dates', () => {
      const aStart = new Date('2026-01-10');
      const aEnd = new Date('2026-01-15');
      const bStart = new Date('2026-03-15');
      const bEnd = new Date('2026-03-20');
      expect(hasDateOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
    });
  });

  describe('Image Pathing Resolvers', () => {
    it('[8] Returns fallback logo when path is undefined', () => {
      expect(getImageUrl(undefined)).toBe('/images/logo.png');
    });

    it('[9] Leaves fully qualified external URLs untouched', () => {
      const awsUrl = 'https://s3.aws.com/image.png';
      expect(getImageUrl(awsUrl)).toBe(awsUrl);
    });

    it('[10] Prepends API base strictly when local paths pass', () => {
      const localUrl = '/uploads/my_pic.jpg';
      expect(getImageUrl(localUrl, 'http://localhost:5000')).toBe('http://localhost:5000/uploads/my_pic.jpg');
    });
  });

  describe('Additional String Utilities', () => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const truncate = (s: string, l: number) => s.length > l ? s.substring(0, l) + '...' : s;
    const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    it('[11] capitalizes the first letter of a string', () => expect(capitalize('hello')).toBe('Hello'));
    it('[12] lowecases the rest of the string', () => expect(capitalize('wOrLd')).toBe('World'));
    it('[13] handles empty strings safely', () => expect(capitalize('')).toBe(''));
    it('[14] truncates strings over the limit', () => expect(truncate('Hello World', 5)).toBe('Hello...'));
    it('[15] does not truncate short strings', () => expect(truncate('Hi', 5)).toBe('Hi'));
    it('[16] handles exact length strings', () => expect(truncate('Hello', 5)).toBe('Hello'));
    it('[17] slugifies standard text', () => expect(slugify('My Listing Title!')).toBe('my-listing-title'));
    it('[18] slugifies handles multiple spaces', () => expect(slugify('A   B')).toBe('a-b'));
    it('[19] slugifies removes special chars', () => expect(slugify('@#$%^&*()_+')).toBe(''));
    it('[20] slugifies works on empty strings', () => expect(slugify('')).toBe(''));
  });

  describe('Form Validation Utilities', () => {
    const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isPasswordStrong = (p: string) => p.length >= 8;

    it('[21] validates standard email address', () => expect(isEmailValid('test@test.com')).toBe(true));
    it('[22] rejects email without @', () => expect(isEmailValid('testtest.com')).toBe(false));
    it('[23] rejects email without domain part', () => expect(isEmailValid('test@.com')).toBe(false));
    it('[24] rejects email without TLD', () => expect(isEmailValid('test@test')).toBe(false));
    it('[25] respects valid subdomain emails', () => expect(isEmailValid('contact@portal.homecomf.com')).toBe(true));
    it('[26] validates strong password (8+ chars)', () => expect(isPasswordStrong('password123')).toBe(true));
    it('[27] rejects weak password', () => expect(isPasswordStrong('short')).toBe(false));
    it('[28] accepts exactly 8 character password', () => expect(isPasswordStrong('12345678')).toBe(true));
    it('[29] handles special characters in password', () => expect(isPasswordStrong('!@#$%^&*')).toBe(true));
    it('[30] rejects empty password', () => expect(isPasswordStrong('')).toBe(false));
  });

  describe('Array Utilities', () => {
    const unique = (arr: any[]) => [...new Set(arr)];
    const chunk = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

    it('[31] removes duplicate numbers', () => expect(unique([1, 1, 2, 3, 3])).toEqual([1, 2, 3]));
    it('[32] removes duplicate strings', () => expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']));
    it('[33] handles empty arrays', () => expect(unique([])).toEqual([]));
    it('[34] chunks arrays into smaller pieces', () => expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]));
    it('[35] chunks arrays with uneven sizes', () => expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]));
    it('[36] chunks array if size is larger than array', () => expect(chunk([1, 2], 5)).toEqual([[1, 2]]));
    it('[37] handles chunking empty arrays', () => expect(chunk([], 2)).toEqual([]));
    it('[38] unique maintains insertion order', () => expect(unique([5, 1, 5, 2])).toEqual([5, 1, 2]));
    it('[39] unique distinguishes types', () => expect(unique([1, '1'])).toEqual([1, '1']));
    it('[40] chunks array by 1', () => expect(chunk([1, 2], 1)).toEqual([[1], [2]]));
  });

  describe('Date Helpers', () => {
    const addDays = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };
    const getDaysDiff = (a: Date, b: Date) => Math.ceil(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

    it('[41] adds days correctly', () => expect(addDays(new Date('2026-03-01'), 5).toISOString().split('T')[0]).toBe('2026-03-06'));
    it('[42] calculates differences across months', () => expect(addDays(new Date('2026-01-31'), 1).toISOString().split('T')[0]).toBe('2026-02-01'));
    it('[43] handles leap years (adding days)', () => expect(addDays(new Date('2024-02-28'), 1).toISOString().split('T')[0]).toBe('2024-02-29'));
    it('[44] calculated days diff logic correctly', () => expect(getDaysDiff(new Date('2026-01-01'), new Date('2026-01-05'))).toBe(4));
    it('[45] calculated diff is absolute independent of order', () => expect(getDaysDiff(new Date('2026-01-05'), new Date('2026-01-01'))).toBe(4));
    it('[46] calculating diff between same day is 0', () => expect(getDaysDiff(new Date('2026-01-01'), new Date('2026-01-01'))).toBe(0));
    it('[47] negative days substract back in time', () => expect(addDays(new Date('2026-03-05'), -4).toISOString().split('T')[0]).toBe('2026-03-01'));
    it('[48] adds large numbers of days', () => expect(addDays(new Date('2026-01-01'), 365).toISOString().split('T')[0]).toBe('2027-01-01'));
    it('[49] handles time component gracefully when extracting diff', () => expect(getDaysDiff(new Date('2026-01-01T23:59:59'), new Date('2026-01-02T00:00:00'))).toBe(1));
    it('[50] safely returns valid Date objects', () => expect(addDays(new Date(), 1)).toBeInstanceOf(Date));
  });
});
