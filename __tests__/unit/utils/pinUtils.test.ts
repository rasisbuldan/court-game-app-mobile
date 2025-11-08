/**
 * PIN Utilities Unit Tests
 *
 * Comprehensive tests for PIN generation, hashing, and verification utilities.
 * Tests cover PIN format, security, uniqueness, edge cases, and boundary conditions.
 */

import {
  generatePIN,
  hashPIN,
  verifyPIN,
  isValidPINFormat,
  generateShareToken,
} from '../../../utils/pinUtils';

describe('PIN Utils', () => {
  // ==========================================================================
  // GENERATE PIN
  // ==========================================================================

  describe('generatePIN', () => {
    it('should generate a 4-digit PIN', () => {
      const pin = generatePIN();

      expect(pin).toHaveLength(4);
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    it('should generate numeric PIN only', () => {
      const pin = generatePIN();

      expect(pin).toMatch(/^\d+$/);
      expect(Number.isNaN(Number(pin))).toBe(false);
    });

    it('should pad with zeros for small numbers', () => {
      // Generate many PINs to likely get some with leading zeros
      const pins = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        pins.add(generatePIN());
      }

      // Check that we have PINs starting with 0
      const hasLeadingZero = Array.from(pins).some(pin => pin.startsWith('0'));
      expect(hasLeadingZero).toBe(true);
    });

    it('should generate PINs in valid range (0000-9999)', () => {
      for (let i = 0; i < 100; i++) {
        const pin = generatePIN();
        const num = parseInt(pin, 10);

        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(9999);
      }
    });

    it('should generate different PINs (randomness)', () => {
      const pins = new Set<string>();

      // Generate 100 PINs
      for (let i = 0; i < 100; i++) {
        pins.add(generatePIN());
      }

      // Should have many unique PINs (allow some collisions due to small space)
      expect(pins.size).toBeGreaterThan(80);
    });

    it('should handle edge case PINs (0000, 9999)', () => {
      const pins = new Set<string>();

      // Generate many PINs to potentially get edge cases
      for (let i = 0; i < 10000; i++) {
        pins.add(generatePIN());
      }

      // All PINs should be 4 digits
      Array.from(pins).forEach(pin => {
        expect(pin).toHaveLength(4);
        expect(/^\d{4}$/.test(pin)).toBe(true);
      });
    });

    it('should generate valid format consistently', () => {
      for (let i = 0; i < 50; i++) {
        const pin = generatePIN();
        expect(isValidPINFormat(pin)).toBe(true);
      }
    });

    it('should not generate non-numeric characters', () => {
      for (let i = 0; i < 100; i++) {
        const pin = generatePIN();
        expect(pin).not.toContain('a');
        expect(pin).not.toContain('-');
        expect(pin).not.toContain(' ');
        expect(pin).not.toContain('.');
      }
    });
  });

  // ==========================================================================
  // HASH PIN
  // ==========================================================================

  describe('hashPIN', () => {
    it('should hash a valid PIN', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for different PINs', async () => {
      const pin1 = '1234';
      const pin2 = '5678';

      const hash1 = await hashPIN(pin1);
      const hash2 = await hashPIN(pin2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for same PIN (salt)', async () => {
      const pin = '1234';

      const hash1 = await hashPIN(pin);
      const hash2 = await hashPIN(pin);

      // bcrypt uses random salt, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });

    it('should reject empty PIN', async () => {
      await expect(hashPIN('')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('should reject PIN with less than 4 digits', async () => {
      await expect(hashPIN('123')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('should reject PIN with more than 4 digits', async () => {
      await expect(hashPIN('12345')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('should reject non-numeric PIN', async () => {
      await expect(hashPIN('abcd')).rejects.toThrow('PIN must be exactly 4 digits');
      await expect(hashPIN('12a4')).rejects.toThrow('PIN must be exactly 4 digits');
      await expect(hashPIN('1-23')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('should handle PIN with leading zeros', async () => {
      const pin = '0001';
      const hash = await hashPIN(pin);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle PIN 0000', async () => {
      const pin = '0000';
      const hash = await hashPIN(pin);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle PIN 9999', async () => {
      const pin = '9999';
      const hash = await hashPIN(pin);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should produce bcrypt-formatted hash', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should reject null PIN', async () => {
      await expect(hashPIN(null as any)).rejects.toThrow();
    });

    it('should reject undefined PIN', async () => {
      await expect(hashPIN(undefined as any)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // VERIFY PIN
  // ==========================================================================

  describe('verifyPIN', () => {
    it('should verify correct PIN', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      const isValid = await verifyPIN(pin, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      const isValid = await verifyPIN('9999', hash);
      expect(isValid).toBe(false);
    });

    it('should handle multiple verification attempts', async () => {
      const pin = '5678';
      const hash = await hashPIN(pin);

      expect(await verifyPIN(pin, hash)).toBe(true);
      expect(await verifyPIN(pin, hash)).toBe(true);
      expect(await verifyPIN(pin, hash)).toBe(true);
      expect(await verifyPIN('0000', hash)).toBe(false);
    });

    it('should reject empty PIN during verification', async () => {
      const hash = await hashPIN('1234');
      const isValid = await verifyPIN('', hash);

      expect(isValid).toBe(false);
    });

    it('should reject non-4-digit PIN during verification', async () => {
      const hash = await hashPIN('1234');

      expect(await verifyPIN('123', hash)).toBe(false);
      expect(await verifyPIN('12345', hash)).toBe(false);
    });

    it('should reject non-numeric PIN during verification', async () => {
      const hash = await hashPIN('1234');

      expect(await verifyPIN('abcd', hash)).toBe(false);
      expect(await verifyPIN('12a4', hash)).toBe(false);
    });

    it('should handle PIN with leading zeros', async () => {
      const pin = '0042';
      const hash = await hashPIN(pin);

      expect(await verifyPIN(pin, hash)).toBe(true);
      expect(await verifyPIN('0043', hash)).toBe(false);
    });

    it('should handle edge case PINs', async () => {
      const pin1 = '0000';
      const hash1 = await hashPIN(pin1);
      expect(await verifyPIN(pin1, hash1)).toBe(true);

      const pin2 = '9999';
      const hash2 = await hashPIN(pin2);
      expect(await verifyPIN(pin2, hash2)).toBe(true);
    });

    it('should reject invalid hash format', async () => {
      const isValid = await verifyPIN('1234', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    it('should reject empty hash', async () => {
      const isValid = await verifyPIN('1234', '');
      expect(isValid).toBe(false);
    });

    it('should handle null PIN gracefully', async () => {
      const hash = await hashPIN('1234');
      const isValid = await verifyPIN(null as any, hash);

      expect(isValid).toBe(false);
    });

    it('should handle undefined PIN gracefully', async () => {
      const hash = await hashPIN('1234');
      const isValid = await verifyPIN(undefined as any, hash);

      expect(isValid).toBe(false);
    });

    it('should be case-sensitive (though PINs are numeric)', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      // All numeric, so no case sensitivity applies
      expect(await verifyPIN('1234', hash)).toBe(true);
    });

    it('should not verify PIN against hash from different PIN', async () => {
      const hash1 = await hashPIN('1111');
      const hash2 = await hashPIN('2222');

      expect(await verifyPIN('1111', hash2)).toBe(false);
      expect(await verifyPIN('2222', hash1)).toBe(false);
    });
  });

  // ==========================================================================
  // IS VALID PIN FORMAT
  // ==========================================================================

  describe('isValidPINFormat', () => {
    it('should accept valid 4-digit PINs', () => {
      expect(isValidPINFormat('0000')).toBe(true);
      expect(isValidPINFormat('1234')).toBe(true);
      expect(isValidPINFormat('9999')).toBe(true);
      expect(isValidPINFormat('0001')).toBe(true);
      expect(isValidPINFormat('5678')).toBe(true);
    });

    it('should reject PINs with less than 4 digits', () => {
      expect(isValidPINFormat('0')).toBe(false);
      expect(isValidPINFormat('12')).toBe(false);
      expect(isValidPINFormat('123')).toBe(false);
    });

    it('should reject PINs with more than 4 digits', () => {
      expect(isValidPINFormat('12345')).toBe(false);
      expect(isValidPINFormat('123456')).toBe(false);
      expect(isValidPINFormat('00000')).toBe(false);
    });

    it('should reject non-numeric PINs', () => {
      expect(isValidPINFormat('abcd')).toBe(false);
      expect(isValidPINFormat('12ab')).toBe(false);
      expect(isValidPINFormat('1a34')).toBe(false);
      expect(isValidPINFormat('ABCD')).toBe(false);
    });

    it('should reject PINs with special characters', () => {
      expect(isValidPINFormat('12-34')).toBe(false);
      expect(isValidPINFormat('12.34')).toBe(false);
      expect(isValidPINFormat('12 34')).toBe(false);
      expect(isValidPINFormat('12#4')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPINFormat('')).toBe(false);
    });

    it('should reject whitespace', () => {
      expect(isValidPINFormat('    ')).toBe(false);
      expect(isValidPINFormat('1 234')).toBe(false);
      expect(isValidPINFormat(' 1234')).toBe(false);
      expect(isValidPINFormat('1234 ')).toBe(false);
    });

    it('should validate all generated PINs', () => {
      for (let i = 0; i < 100; i++) {
        const pin = generatePIN();
        expect(isValidPINFormat(pin)).toBe(true);
      }
    });

    it('should handle null and undefined', () => {
      expect(isValidPINFormat(null as any)).toBe(false);
      expect(isValidPINFormat(undefined as any)).toBe(false);
    });

    it('should handle non-string values', () => {
      // The regex test will coerce number to string, so 1234 becomes "1234" and passes
      expect(isValidPINFormat(1234 as any)).toBe(true);
      // Objects and arrays won't match the regex
      expect(isValidPINFormat({} as any)).toBe(false);
      expect(isValidPINFormat([] as any)).toBe(false);
    });
  });

  // ==========================================================================
  // GENERATE SHARE TOKEN
  // ==========================================================================

  describe('generateShareToken', () => {
    it('should generate a UUID', () => {
      const token = generateShareToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate UUID v4 format', () => {
      const token = generateShareToken();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(token).toMatch(uuidRegex);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(generateShareToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();
      const token3 = generateShareToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should have correct UUID structure', () => {
      const token = generateShareToken();
      const parts = token.split('-');

      expect(parts).toHaveLength(5);
      expect(parts[0].length).toBe(8);
      expect(parts[1].length).toBe(4);
      expect(parts[2].length).toBe(4);
      expect(parts[3].length).toBe(4);
      expect(parts[4].length).toBe(12);
    });

    it('should have 4 in third section (version 4)', () => {
      const token = generateShareToken();
      const parts = token.split('-');

      expect(parts[2].startsWith('4')).toBe(true);
    });

    it('should have valid variant bits in fourth section', () => {
      const token = generateShareToken();
      const parts = token.split('-');

      const firstChar = parts[3][0].toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(firstChar);
    });

    it('should generate lowercase hex characters', () => {
      const token = generateShareToken();

      // Remove hyphens and check all characters are valid hex
      const hex = token.replace(/-/g, '');
      expect(/^[0-9a-f]+$/i.test(hex)).toBe(true);
    });

    it('should maintain format across multiple generations', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      for (let i = 0; i < 50; i++) {
        const token = generateShareToken();
        expect(token).toMatch(uuidRegex);
      }
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('PIN Workflow Integration', () => {
    it('should support complete PIN lifecycle', async () => {
      // 1. Generate PIN
      const pin = generatePIN();
      expect(isValidPINFormat(pin)).toBe(true);

      // 2. Hash PIN
      const hash = await hashPIN(pin);
      expect(hash).toBeTruthy();

      // 3. Verify correct PIN
      expect(await verifyPIN(pin, hash)).toBe(true);

      // 4. Reject incorrect PIN
      const wrongPin = pin === '0000' ? '9999' : '0000';
      expect(await verifyPIN(wrongPin, hash)).toBe(false);
    });

    it('should handle multiple PINs independently', async () => {
      const pin1 = generatePIN();
      const pin2 = generatePIN();

      const hash1 = await hashPIN(pin1);
      const hash2 = await hashPIN(pin2);

      // Each PIN should verify against its own hash
      expect(await verifyPIN(pin1, hash1)).toBe(true);
      expect(await verifyPIN(pin2, hash2)).toBe(true);

      // Cross-verification should fail (unless PINs happen to match)
      if (pin1 !== pin2) {
        expect(await verifyPIN(pin1, hash2)).toBe(false);
        expect(await verifyPIN(pin2, hash1)).toBe(false);
      }
    });

    it('should combine PIN and share token generation', async () => {
      // Generate PIN for authentication
      const pin = generatePIN();
      expect(isValidPINFormat(pin)).toBe(true);

      // Generate token for sharing
      const token = generateShareToken();
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(20);

      // Hash PIN for storage
      const hash = await hashPIN(pin);
      expect(hash).toBeTruthy();

      // Verify PIN works
      expect(await verifyPIN(pin, hash)).toBe(true);
    });
  });

  // ==========================================================================
  // SECURITY TESTS
  // ==========================================================================

  describe('Security Considerations', () => {
    it('should use salted hashing (different hashes for same PIN)', async () => {
      const pin = '1234';
      const hashes = new Set<string>();

      for (let i = 0; i < 5; i++) {
        hashes.add(await hashPIN(pin));
      }

      // All hashes should be different due to random salt
      expect(hashes.size).toBe(5);
    });

    it('should not reveal PIN from hash', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      // Hash should not contain the PIN
      expect(hash).not.toContain('1234');
    });

    it('should handle timing-safe comparison', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);

      const start1 = Date.now();
      await verifyPIN('0000', hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifyPIN('1234', hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reason) for timing attack resistance
      // This is a rough check; bcrypt inherently provides timing safety
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set<string>();

      // Generate many tokens to test randomness
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateShareToken());
      }

      // All should be unique
      expect(tokens.size).toBe(1000);
    });

    it('should not accept obvious PIN patterns as more secure', async () => {
      // All PINs should be treated equally from security perspective
      const weakPins = ['0000', '1234', '1111', '9999'];

      for (const pin of weakPins) {
        const hash = await hashPIN(pin);
        expect(hash).toBeTruthy();
        expect(await verifyPIN(pin, hash)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid PIN generation', () => {
      const pins: string[] = [];

      for (let i = 0; i < 1000; i++) {
        pins.push(generatePIN());
      }

      // All should be valid
      pins.forEach(pin => {
        expect(isValidPINFormat(pin)).toBe(true);
      });

      // Most should be unique (allow some collisions in 10000 space)
      const uniquePins = new Set(pins);
      expect(uniquePins.size).toBeGreaterThan(900);
    });

    it('should handle rapid token generation', () => {
      const tokens: string[] = [];

      for (let i = 0; i < 100; i++) {
        tokens.push(generateShareToken());
      }

      // All should be unique and valid
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);
    });

    it('should handle concurrent hashing', async () => {
      const pins = ['1111', '2222', '3333', '4444', '5555'];

      const hashes = await Promise.all(pins.map(pin => hashPIN(pin)));

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);

      // Each PIN should verify against its hash
      for (let i = 0; i < pins.length; i++) {
        expect(await verifyPIN(pins[i], hashes[i])).toBe(true);
      }
    });

    it('should handle concurrent verification', async () => {
      const pin = '7777';
      const hash = await hashPIN(pin);

      const results = await Promise.all([
        verifyPIN(pin, hash),
        verifyPIN(pin, hash),
        verifyPIN(pin, hash),
        verifyPIN('0000', hash),
        verifyPIN('9999', hash),
      ]);

      expect(results).toEqual([true, true, true, false, false]);
    });

    it('should handle very long hash strings', async () => {
      const pin = '5432';
      const hash = await hashPIN(pin);

      expect(hash.length).toBeGreaterThan(50);
      expect(await verifyPIN(pin, hash)).toBe(true);
    });
  });

  // ==========================================================================
  // PERFORMANCE TESTS
  // ==========================================================================

  describe('Performance', () => {
    it('should generate PIN quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        generatePIN();
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should generate token quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        generateShareToken();
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should validate PIN format quickly', () => {
      const pins = Array.from({ length: 1000 }, () => generatePIN());

      const start = Date.now();

      pins.forEach(pin => {
        isValidPINFormat(pin);
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
