/*
 * Derives a 256-bit encryption key from a password using Argon2id.
 * Uses memory-hard hashing to resist brute-force attacks.
 */
async function generateKeyFromPassword(password, salt) {
  const result = await argon2.hash({
    pass: password,
    salt: salt,
    time: 3,
    mem: 131072,
    hashLen: 32,
    parallelism: 1,
    type: argon2.ArgonType.Argon2id
  });

  return result.hash;
}

/*
 * Encrypts data using AES-256-GCM with a password-derived key.
 * Returns a binary blob containing: [16-byte salt][12-byte IV][ciphertext].
 */
export async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyHash = await generateKeyFromPassword(password, salt);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  const finalBuffer = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
  finalBuffer.set(salt, 0);
  finalBuffer.set(iv, salt.length);
  finalBuffer.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

  return finalBuffer;
}

/*
 * Decrypts a binary blob that was encrypted with encryptData.
 * Extracts salt and IV from the blob, derives the key, and decrypts.
 * Throws an error if the password is incorrect or data is corrupted.
 */
export async function decryptData(encryptedBlob, password) {
  try {
    const encryptedData = new Uint8Array(encryptedBlob);

    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const data = encryptedData.slice(28);

    const keyHash = await generateKeyFromPassword(password, salt);
    const key = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);

    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

/*
 * Generates a cryptographically secure random password.
 * Configurable length and character sets (uppercase, lowercase, numbers, symbols).
 */
export function generatePassword(options = {}) {
  const defaults = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  };

  const config = { ...defaults, ...options };

  let charset = '';
  if (config.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (config.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (config.numbers) charset += '0123456789';
  if (config.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) {
    throw new Error('At least one character type must be selected');
  }

  const array = new Uint32Array(config.length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < config.length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

/*
 * Calculates password strength on a 0-5 scale.
 * Based on length thresholds and character diversity.
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0;

  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 5);
}
