/**
 * Password policy enforcement utilities.
 * Requirements:
 * - Minimum 8 characters, maximum 128
 * - At least 3 of 4: uppercase, lowercase, digit, special char
 * - Not a common password
 * - Not contain personal info (name, email prefix)
 */

const COMMON_PASSWORDS = new Set([
  '12345678', 'password', 'password1', '123456789', '1234567890',
  'qwerty123', 'abc123', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'sunshine', 'princess', 'football',
  'iloveyou', 'trustno1', 'admin123', '1234', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'batman',
  'qazwsx', 'michael', 'ashley', 'qwertyuiop', 'password123',
]);

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  errors: string[];
  suggestions: string[];
}

export const checkPasswordStrength = (
  password: string,
  personalInfo?: { name?: string; email?: string }
): PasswordStrengthResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    suggestions.push('Add more characters (at least 8 total)');
  }
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Complexity checks
  let complexityScore = 0;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(password);

  if (hasUpper) complexityScore++;
  if (hasLower) complexityScore++;
  if (hasDigit) complexityScore++;
  if (hasSpecial) complexityScore++;

  if (complexityScore < 3) {
    const missing: string[] = [];
    if (!hasUpper) missing.push('uppercase letter');
    if (!hasLower) missing.push('lowercase letter');
    if (!hasDigit) missing.push('digit');
    if (!hasSpecial) missing.push('special character');
    errors.push(`Password must include at least 3 of: uppercase, lowercase, digit, special character`);
    suggestions.push(`Add a${missing.length === 1 ? '' : ''} ${missing.join(', ')}`);
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
    suggestions.push('Choose a more unique password');
  }

  // Personal info check
  if (personalInfo) {
    const lowerPassword = password.toLowerCase();
    if (personalInfo.name) {
      const nameParts = personalInfo.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && lowerPassword.includes(part)) {
          errors.push('Password should not contain your name');
          break;
        }
      }
    }
    if (personalInfo.email) {
      const emailPrefix = personalInfo.email.split('@')[0].toLowerCase();
      if (emailPrefix.length > 2 && lowerPassword.includes(emailPrefix)) {
        errors.push('Password should not contain your email address');
      }
    }
  }

  // Sequential/repeating character check
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password contains too many repeated characters');
    suggestions.push('Avoid repeating the same character 4+ times');
  }
  if (/^(?:0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef|qwerty|asdfgh|zxcvbn)/i.test(password)) {
    errors.push('Password contains a common sequential pattern');
    suggestions.push('Avoid sequential patterns like "1234" or "abcd"');
  }

  // Calculate strength score (0-4)
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (complexityScore >= 3) score++;
  if (complexityScore >= 4 && password.length >= 12) score++;

  let label: PasswordStrengthResult['label'] = 'Weak';
  if (score >= 4) label = 'Very Strong';
  else if (score >= 3) label = 'Strong';
  else if (score >= 1) label = 'Fair';

  return { score, label, errors, suggestions };
};

export const validatePassword = (
  password: string,
  personalInfo?: { name?: string; email?: string }
): { valid: boolean; errors: string[] } => {
  const result = checkPasswordStrength(password, personalInfo);
  return {
    valid: result.errors.length === 0,
    errors: result.errors,
  };
};
