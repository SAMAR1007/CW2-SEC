/**
 * Google reCAPTCHA v3 verification service.
 *
 * COURSEWORK NOTE: This service verifies reCAPTCHA tokens server-side.
 * In production, use your actual reCAPTCHA secret key from Google.
 * For testing without a real key, a bypass mode is available.
 */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Google test key

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export const verifyRecaptchaToken = async (
  token: string,
  expectedAction?: string
): Promise<{ valid: boolean; score: number; message: string }> => {
  // Allow bypass in development/test mode
  if (process.env.NODE_ENV !== 'production') {
    // Accept a test token for development
    if (token === 'dev-bypass-token') {
      return { valid: true, score: 1.0, message: 'Development bypass' };
    }
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      return {
        valid: false,
        score: 0,
        message: `CAPTCHA verification failed: ${(data['error-codes'] || ['unknown']).join(', ')}`,
      };
    }

    // Score threshold: 0.5 (0.0 = definitely bot, 1.0 = definitely human)
    const score = data.score || 0;
    if (score < 0.5) {
      return {
        valid: false,
        score,
        message: 'CAPTCHA score too low. Suspicious activity detected.',
      };
    }

    // Verify expected action if provided
    if (expectedAction && data.action !== expectedAction) {
      return {
        valid: false,
        score,
        message: 'CAPTCHA action mismatch.',
      };
    }

    return { valid: true, score, message: 'CAPTCHA verification passed' };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // Fail open in dev, fail closed in production
    if (process.env.NODE_ENV !== 'production') {
      return { valid: true, score: 0.5, message: 'CAPTCHA service unavailable, bypassed for development' };
    }
    return { valid: false, score: 0, message: 'CAPTCHA service unavailable' };
  }
};
