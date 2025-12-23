/**
 * TOTP (Time-based One-Time Password) Implementation
 * RFC 6238 compliant implementation using Web Crypto API
 */

// Base32 alphabet for decoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode a base32 encoded string to Uint8Array
 */
export function base32Decode(encoded) {
  // Remove spaces and convert to uppercase
  const cleanedInput = encoded.replace(/\s+/g, '').toUpperCase();

  // Remove padding
  const unpadded = cleanedInput.replace(/=+$/, '');

  const bytes = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const char of unpadded) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    buffer = (buffer << 5) | value;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Validate a TOTP secret (base32 encoded)
 */
export function isValidTotpSecret(secret) {
  if (!secret || typeof secret !== 'string') return false;

  const cleaned = secret.replace(/\s+/g, '').toUpperCase().replace(/=+$/, '');
  if (cleaned.length < 16) return false; // Minimum 80 bits for security

  for (const char of cleaned) {
    if (!BASE32_ALPHABET.includes(char)) return false;
  }

  return true;
}

/**
 * Generate TOTP code using HMAC-SHA1
 * @param {string} secret - Base32 encoded secret
 * @param {Object} options - Configuration options
 * @param {number} options.digits - Number of digits (default: 6)
 * @param {number} options.period - Time period in seconds (default: 30)
 * @param {number} options.timestamp - Optional timestamp (default: current time)
 */
export async function generateTOTP(secret, options = {}) {
  const { digits = 6, period = 30, timestamp = Date.now() } = options;

  try {
    // Decode the base32 secret
    const secretBytes = base32Decode(secret);

    // Calculate counter (number of time steps since epoch)
    const counter = Math.floor(timestamp / 1000 / period);

    // Convert counter to 8-byte big-endian buffer
    const counterBytes = new Uint8Array(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    // Import the secret key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const hmac = new Uint8Array(signature);

    // Dynamic truncation (RFC 4226)
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    // Generate the OTP
    const otp = binary % Math.pow(10, digits);

    // Pad with leading zeros if necessary
    return otp.toString().padStart(digits, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return null;
  }
}

/**
 * Get the time remaining until the next TOTP code
 * @param {number} period - Time period in seconds (default: 30)
 * @returns {number} Seconds remaining
 */
export function getTimeRemaining(period = 30) {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/**
 * Get the current time step counter
 * @param {number} period - Time period in seconds (default: 30)
 * @returns {number} Current counter value
 */
export function getCurrentCounter(period = 30) {
  return Math.floor(Date.now() / 1000 / period);
}

/**
 * Format TOTP code with space in the middle for readability
 * e.g., "123456" -> "123 456"
 */
export function formatTotpCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Parse an otpauth:// URI and extract the secret and parameters
 * Format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
 */
export function parseOtpAuthUri(uri) {
  try {
    if (!uri.startsWith('otpauth://totp/')) {
      return null;
    }

    const url = new URL(uri);
    const params = url.searchParams;

    return {
      secret: params.get('secret'),
      issuer: params.get('issuer'),
      algorithm: params.get('algorithm') || 'SHA1',
      digits: parseInt(params.get('digits') || '6', 10),
      period: parseInt(params.get('period') || '30', 10),
      label: decodeURIComponent(url.pathname.slice(1)) // Remove leading /
    };
  } catch {
    return null;
  }
}
