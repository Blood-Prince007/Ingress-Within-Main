/**
 * Server-side email validation and sanitization utility.
 * Guarantees RFC-compliant email formatting and blocks CRLF / Header Injection attempts.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface EmailValidationResult {
  valid: boolean;
  normalizedEmail?: string;
  error?: string;
}

export function validateAndNormalizeEmail(rawEmail: any): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      valid: false,
      error: 'Email address is required.',
    };
  }

  const trimmed = rawEmail.trim();

  // 1. Check for CRLF / Header injection characters
  if (/[\r\n\t]|%0a|%0d/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Email address contains invalid header control characters.',
    };
  }

  // 2. Length check (RFC 5321 specifies maximum 254 characters)
  if (trimmed.length > 254) {
    return {
      valid: false,
      error: 'Email address exceeds maximum length of 254 characters.',
    };
  }

  if (trimmed.length < 5) {
    return {
      valid: false,
      error: 'Email address is too short.',
    };
  }

  // 3. Format check
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Please provide a valid email address (e.g. name@example.com).',
    };
  }

  // 4. Normalized lowercase email
  const [localPart, domainPart] = trimmed.split('@');
  if (!domainPart || !domainPart.includes('.')) {
    return {
      valid: false,
      error: 'Email domain must contain a valid top-level domain.',
    };
  }

  const normalized = `${localPart}@${domainPart.toLowerCase()}`;

  return {
    valid: true,
    normalizedEmail: normalized,
  };
}
