/**
 * PIN Utilities for Session Sharing
 *
 * Provides functions to generate, hash, and verify 4-digit PINs
 * for secure session sharing
 */

import bcrypt from 'bcryptjs';
import { Logger } from './logger';

const SALT_ROUNDS = 10;

/**
 * Generate a random 4-digit PIN
 * @returns 4-digit PIN as string (e.g., "1234", "0056")
 */
export function generatePIN(): string {
  // Generate random number between 0000-9999
  const pin = Math.floor(Math.random() * 10000);
  // Pad with zeros to ensure 4 digits
  return pin.toString().padStart(4, '0');
}

/**
 * Hash a PIN using bcrypt
 * @param pin - 4-digit PIN string
 * @returns Bcrypt hash of the PIN
 */
export async function hashPIN(pin: string): Promise<string> {
  try {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    const hash = await bcrypt.hash(pin, SALT_ROUNDS);

    Logger.debug('PIN hashed successfully', {
      action: 'hash_pin',
    });

    return hash;
  } catch (error) {
    Logger.error('Failed to hash PIN', error, {
      action: 'hash_pin',
    });
    throw error;
  }
}

/**
 * Verify a PIN against its hash
 * @param pin - Plain text PIN to verify
 * @param hash - Bcrypt hash to compare against
 * @returns true if PIN matches, false otherwise
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  try {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return false;
    }

    const isValid = await bcrypt.compare(pin, hash);

    Logger.debug('PIN verification', {
      action: 'verify_pin',
      result: isValid ? 'success' : 'failed',
    });

    return isValid;
  } catch (error) {
    Logger.error('Failed to verify PIN', error, {
      action: 'verify_pin',
    });
    return false;
  }
}

/**
 * Validate PIN format (4 digits)
 * @param pin - PIN string to validate
 * @returns true if PIN is valid format
 */
export function isValidPINFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Generate a unique share token (UUID v4)
 * @returns UUID string
 */
export function generateShareToken(): string {
  // Use crypto.randomUUID() if available (newer environments)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
