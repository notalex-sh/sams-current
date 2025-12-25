const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/*
 * Decodes a Base32 encoded string into a Uint8Array.
 * Handles padding and whitespace, throws on invalid characters.
 */
function base32Decode(encoded) {
  const cleanedInput = encoded.replace(/\s+/g, '').toUpperCase();
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

/*
 * Generates a TOTP code using HMAC-SHA1 per RFC 6238.
 * Takes a Base32 secret and optional config (digits, period, timestamp).
 * Returns a zero-padded string of digits.
 */
export async function generateTOTP(secret, options = {}) {
  const { digits = 6, period = 30, timestamp = Date.now() } = options;

  try {
    const secretBytes = base32Decode(secret);
    const counter = Math.floor(timestamp / 1000 / period);

    const counterBytes = new Uint8Array(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);

    return otp.toString().padStart(digits, '0');
  } catch (error) {
    return null;
  }
}

/*
 * Returns seconds remaining until the next TOTP code refresh.
 */
export function getTimeRemaining(period = 30) {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/*
 * Formats a 6-digit TOTP code with a space for readability (e.g., "123 456").
 */
export function formatTotpCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/*
 * Parses an otpauth:// URI and extracts TOTP parameters.
 * Returns an object with secret, issuer, algorithm, digits, period, and label.
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
      label: decodeURIComponent(url.pathname.slice(1))
    };
  } catch {
    return null;
  }
}
