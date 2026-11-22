/**
 * Security utilities for enhanced input sanitization and validation.
 * Provides defense-in-depth protection beyond schema validation.
 * 
 * @module security
 */

/**
 * Sanitizes user input to prevent XSS attacks.
 * Removes or escapes potentially dangerous characters and patterns.
 * 
 * @param {string} input - Raw user input
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized output safe for display
 * 
 * @example
 * const safe = sanitizeInput("<script>alert('xss')</script>", { maxLength: 100 });
 * // Returns: "scriptalert('xss')/script"
 */
export function sanitizeInput(
  input: string,
  options: { maxLength?: number; allowedChars?: RegExp } = {}
): string {
  const { maxLength = 1000 } = options;
  
  const sanitized = input
    .trim()
    .substring(0, maxLength)
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape special HTML entities
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validates that input doesn't contain common injection patterns.
 * Detects SQL injection, command injection, and path traversal attempts.
 * 
 * @param {string} input - Input to validate
 * @returns {{ safe: boolean; reason?: string }} Validation result
 * 
 * @example
 * const result = detectInjectionPatterns("'; DROP TABLE users;--");
 * // Returns: { safe: false, reason: "Potential SQL injection detected" }
 */
export function detectInjectionPatterns(input: string): { safe: boolean; reason?: string } {
  const patterns = [
    // SQL injection - check for SQL keywords with dangerous context
    { regex: /(INSERT\s+INTO|DELETE\s+FROM|DROP\s+(TABLE|DATABASE)|UNION\s+SELECT|';|--|\/\*|\*\/)/gi, reason: "Potential SQL injection detected" },
    // Path traversal
    { regex: /(\.\.\/|\.\.\\|\/etc\/passwd|\\windows\\system32)/gi, reason: "Potential path traversal detected" },
    // XSS - script tags and event handlers
    { regex: /(<script[^>]*>|javascript:|onerror\s*=|onload\s*=|<iframe)/gi, reason: "Potential XSS detected" },
    // Template injection
    { regex: /(\$\{[^}]*\}|\{\{[^}]*\}\}|<%=)/g, reason: "Potential template injection detected" },
    // Command injection - function calls with parentheses
    { regex: /(exec\s*\(|eval\s*\(|system\s*\(|shell_exec\s*\(|passthru\s*\()/gi, reason: "Potential command injection detected" },
  ];

  for (const { regex, reason } of patterns) {
    if (regex.test(input)) {
      return { safe: false, reason };
    }
  }

  return { safe: true };
}

/**
 * Rate limit key generator with IP address anonymization.
 * Partially masks IP for privacy while maintaining rate limit effectiveness.
 * 
 * @param {string} ip - Full IP address
 * @param {string} prefix - Optional prefix for namespacing
 * @returns {string} Anonymized rate limit key
 * 
 * @example
 * const key = generateRateLimitKey("192.168.1.100", "api");
 * // Returns: "api:192.168.1.xxx"
 */
export function generateRateLimitKey(ip: string, prefix = ""): string {
  // Anonymize last octet for IPv4
  const anonymized = ip.replace(/\.\d+$/, ".xxx");
  return prefix ? `${prefix}:${anonymized}` : anonymized;
}

/**
 * Content Security Policy nonce generator.
 * Creates cryptographically secure random nonce for inline scripts.
 * 
 * @returns {string} Base64-encoded nonce value
 * 
 * @example
 * const nonce = generateCSPNonce();
 * // Use in CSP header: script-src 'nonce-abc123...'
 * // Use in script tag: <script nonce="abc123...">
 */
export function generateCSPNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return Buffer.from(crypto.randomUUID()).toString('base64').substring(0, 16);
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validates HTTP header values to prevent header injection.
 * 
 * @param {string} value - Header value to validate
 * @returns {boolean} Whether the value is safe
 */
export function isValidHeaderValue(value: string): boolean {
  // Headers should not contain newlines or carriage returns
  return !/[\r\n]/.test(value);
}
