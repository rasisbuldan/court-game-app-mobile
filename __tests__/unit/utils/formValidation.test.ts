/**
 * Form Validation Unit Tests
 *
 * Comprehensive tests for all form validation utilities.
 * Tests cover happy paths, error cases, edge cases, and boundary conditions.
 */

import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateSessionName,
  validateUsername,
  validateClubName,
  validateBio,
  validateUrl,
  validateNumberRange,
  validatePlayerName,
  validateReclubUrl,
  getFirstError,
  allValid,
} from '../../../utils/formValidation';

describe('Form Validation Utils', () => {
  // ==========================================================================
  // EMAIL VALIDATION
  // ==========================================================================
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
        'user@example.co.uk',
        'user123@example.com',
        'first.last@company.org',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('');
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        { email: 'invalid', reason: 'missing @ and domain' },
        { email: 'user@', reason: 'missing domain' },
        { email: '@example.com', reason: 'missing local part' },
        { email: 'user @example.com', reason: 'space in local part' },
        { email: 'user@exam ple.com', reason: 'space in domain' },
        { email: 'user@@example.com', reason: 'double @' },
        { email: 'user@.com', reason: 'domain starts with dot' },
      ];

      invalidEmails.forEach(({ email }) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeTruthy();
      });
    });

    it('should handle empty or null inputs', () => {
      const result1 = validateEmail('');
      expect(result1.isValid).toBe(false);
      expect(result1.message).toBe('Email address is required');

      const result2 = validateEmail('   ');
      expect(result2.isValid).toBe(false);
      expect(result2.message).toBe('Email address is required');
    });

    it('should detect double dots in domain', () => {
      const result = validateEmail('user@example..com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email address contains invalid characters');
    });

    it('should trim whitespace before validation', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // PASSWORD VALIDATION
  // ==========================================================================
  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'Secure@Pass123',
        'LongPasswordWithManyCharacters',
        'simple6',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('');
      });
    });

    it('should enforce minimum length', () => {
      const result1 = validatePassword('short', 6);
      expect(result1.isValid).toBe(false);
      expect(result1.message).toContain('at least 6 characters');

      const result2 = validatePassword('validPassword', 8);
      expect(result2.isValid).toBe(true);
    });

    it('should reject common weak passwords', () => {
      const result1 = validatePassword('password');
      expect(result1.isValid).toBe(false);
      expect(result1.message).toContain('too common');

      const result2 = validatePassword('123456');
      expect(result2.isValid).toBe(false);
      expect(result2.message).toContain('too common');
    });

    it('should handle empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('should use custom minimum length', () => {
      const result = validatePassword('pass', 10);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 10 characters');
    });
  });

  // ==========================================================================
  // DISPLAY NAME VALIDATION
  // ==========================================================================
  describe('validateDisplayName', () => {
    it('should accept valid display names', () => {
      const validNames = [
        'John Doe',
        "Mary O'Brien",
        'Jean-Pierre',
        'Anne-Marie Smith',
        'Bob',
      ];

      validNames.forEach(name => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('');
      });
    });

    it('should reject names that are too short', () => {
      const result = validateDisplayName('A', 2);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 2 characters');
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateDisplayName(longName, 2, 50);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('50 characters or less');
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = [
        'John123',
        'John@Doe',
        'John.Doe',
        'John_Doe',
        'John#Doe',
      ];

      invalidNames.forEach(name => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('letters, spaces, hyphens, and apostrophes');
      });
    });

    it('should handle empty names', () => {
      const result = validateDisplayName('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name is required');
    });

    it('should trim whitespace', () => {
      const result = validateDisplayName('  John Doe  ');
      expect(result.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // SESSION NAME VALIDATION
  // ==========================================================================
  describe('validateSessionName', () => {
    it('should accept valid session names', () => {
      const validNames = [
        'Friday Night Games',
        'Tournament 2024',
        'Mixed Doubles @ Club',
        'Weekend Warriors',
      ];

      validNames.forEach(name => {
        const result = validateSessionName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject empty session names', () => {
      const result = validateSessionName('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Session name is required');
    });

    it('should enforce maximum length', () => {
      const longName = 'A'.repeat(61);
      const result = validateSessionName(longName, 60);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('60 characters or less');
    });

    it('should trim whitespace', () => {
      const result = validateSessionName('  Valid Name  ');
      expect(result.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // USERNAME VALIDATION
  // ==========================================================================
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'alice_in_wonderland',
        'bob',
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab', 3);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 3 characters');
    });

    it('should reject usernames that are too long', () => {
      const longUsername = 'a'.repeat(31);
      const result = validateUsername(longUsername, 3, 30);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('30 characters or less');
    });

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = [
        'john-doe',
        'john.doe',
        'john@doe',
        'john doe',
        'john#doe',
      ];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('letters, numbers, and underscores');
      });
    });

    it('should reject usernames starting with underscore', () => {
      const result = validateUsername('_john');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('must start with a letter or number');
    });

    it('should handle empty usernames', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username is required');
    });
  });

  // ==========================================================================
  // CLUB NAME VALIDATION
  // ==========================================================================
  describe('validateClubName', () => {
    it('should accept valid club names', () => {
      const validNames = [
        'Tennis Club',
        'Padel_Club_2024',
        'City-Club',
        'Club 123',
      ];

      validNames.forEach(name => {
        const result = validateClubName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject club names that are too short', () => {
      const result = validateClubName('TC', 3);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 3 characters');
    });

    it('should reject club names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateClubName(longName, 3, 50);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('50 characters or less');
    });

    it('should reject club names with special characters', () => {
      const result = validateClubName('Club@Name!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('letters, numbers, spaces, hyphens, and underscores');
    });

    it('should handle empty club names', () => {
      const result = validateClubName('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Club name is required');
    });
  });

  // ==========================================================================
  // BIO VALIDATION
  // ==========================================================================
  describe('validateBio', () => {
    it('should accept valid bios', () => {
      const result = validateBio('I love playing tennis!');
      expect(result.isValid).toBe(true);
    });

    it('should accept empty bio when not required', () => {
      const result = validateBio('', 200, false);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty bio when required', () => {
      const result = validateBio('', 200, true);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Description is required');
    });

    it('should enforce maximum length', () => {
      const longBio = 'A'.repeat(201);
      const result = validateBio(longBio, 200);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('200 characters or less');
    });

    it('should accept bio at maximum length', () => {
      const maxBio = 'A'.repeat(200);
      const result = validateBio(maxBio, 200);
      expect(result.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // URL VALIDATION
  // ==========================================================================
  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://subdomain.example.com/path',
        'https://example.com/path?query=value',
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        // Note: 'htp://example.com' is actually valid per URL constructor (wrong protocol but valid format)
        '//example.com',
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('valid URL');
      });
    });

    it('should enforce allowed domains', () => {
      const result1 = validateUrl('https://reclub.co/event', ['reclub.co']);
      expect(result1.isValid).toBe(true);

      const result2 = validateUrl('https://example.com/event', ['reclub.co']);
      expect(result2.isValid).toBe(false);
      expect(result2.message).toContain('reclub.co');
    });

    it('should accept subdomains of allowed domains', () => {
      const result = validateUrl('https://www.reclub.co/event', ['reclub.co']);
      expect(result.isValid).toBe(true);
    });

    it('should handle empty URL', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('URL is required');
    });

    it('should handle multiple allowed domains', () => {
      const result1 = validateUrl('https://reclub.co/event', ['reclub.co', 'example.com']);
      expect(result1.isValid).toBe(true);

      const result2 = validateUrl('https://example.com/event', ['reclub.co', 'example.com']);
      expect(result2.isValid).toBe(true);

      const result3 = validateUrl('https://other.com/event', ['reclub.co', 'example.com']);
      expect(result3.isValid).toBe(false);
    });
  });

  // ==========================================================================
  // NUMBER RANGE VALIDATION
  // ==========================================================================
  describe('validateNumberRange', () => {
    it('should accept numbers within range', () => {
      const result = validateNumberRange(5, 1, 10);
      expect(result.isValid).toBe(true);
    });

    it('should accept numbers at boundaries', () => {
      const result1 = validateNumberRange(1, 1, 10);
      expect(result1.isValid).toBe(true);

      const result2 = validateNumberRange(10, 1, 10);
      expect(result2.isValid).toBe(true);
    });

    it('should reject numbers below minimum', () => {
      const result = validateNumberRange(0, 1, 10, 'Players');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Players must be at least 1');
    });

    it('should reject numbers above maximum', () => {
      const result = validateNumberRange(11, 1, 10, 'Courts');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Courts must be 10 or less');
    });

    it('should use custom field name in error messages', () => {
      const result = validateNumberRange(0, 1, 10, 'Rating');
      expect(result.message).toContain('Rating');
    });

    it('should use default field name', () => {
      const result = validateNumberRange(0, 1, 10);
      expect(result.message).toContain('Value');
    });
  });

  // ==========================================================================
  // PLAYER NAME VALIDATION
  // ==========================================================================
  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      const result = validatePlayerName('Alice');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validatePlayerName('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Player name is required');
    });

    it('should reject names that are too short', () => {
      const result = validatePlayerName('A');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 2 characters');
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(31);
      const result = validatePlayerName(longName);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('30 characters or less');
    });

    it('should detect duplicates (case-insensitive)', () => {
      const existingNames = ['Alice', 'Bob', 'Charlie'];

      const result1 = validatePlayerName('alice', existingNames);
      expect(result1.isValid).toBe(false);
      expect(result1.message).toContain('already been added');

      const result2 = validatePlayerName('ALICE', existingNames);
      expect(result2.isValid).toBe(false);

      const result3 = validatePlayerName('David', existingNames);
      expect(result3.isValid).toBe(true);
    });

    it('should trim whitespace before checking', () => {
      const result = validatePlayerName('  Alice  ');
      expect(result.isValid).toBe(true);
    });

    it('should trim before duplicate check', () => {
      const existingNames = ['Alice'];
      const result = validatePlayerName('  Alice  ', existingNames);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('already been added');
    });
  });

  // ==========================================================================
  // RECLUB URL VALIDATION
  // ==========================================================================
  describe('validateReclubUrl', () => {
    it('should accept valid Reclub URLs', () => {
      const validUrls = [
        'https://reclub.co/m/event-123',
        'http://reclub.co/m/event-456',
        'https://www.reclub.co/m/event-789',
        'HTTPS://RECLUB.CO/m/event', // case insensitive
      ];

      validUrls.forEach(url => {
        const result = validateReclubUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject non-Reclub URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'https://notreclub.co/event',
        'https://reclub.com/event',
        'reclub.co/event', // missing protocol
      ];

      invalidUrls.forEach(url => {
        const result = validateReclubUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('valid Reclub URL');
      });
    });

    it('should handle empty URL', () => {
      const result = validateReclubUrl('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('enter a Reclub event URL');
    });

    it('should trim whitespace', () => {
      const result = validateReclubUrl('  https://reclub.co/m/event  ');
      expect(result.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  describe('getFirstError', () => {
    it('should return first error message', () => {
      const validations = [
        { isValid: true, message: '' },
        { isValid: false, message: 'Error 1' },
        { isValid: false, message: 'Error 2' },
      ];

      const error = getFirstError(validations);
      expect(error).toBe('Error 1');
    });

    it('should return empty string if all valid', () => {
      const validations = [
        { isValid: true, message: '' },
        { isValid: true, message: '' },
      ];

      const error = getFirstError(validations);
      expect(error).toBe('');
    });

    it('should handle empty array', () => {
      const error = getFirstError([]);
      expect(error).toBe('');
    });
  });

  describe('allValid', () => {
    it('should return true if all validations pass', () => {
      const validations = [
        { isValid: true, message: '' },
        { isValid: true, message: '' },
      ];

      expect(allValid(validations)).toBe(true);
    });

    it('should return false if any validation fails', () => {
      const validations = [
        { isValid: true, message: '' },
        { isValid: false, message: 'Error' },
      ];

      expect(allValid(validations)).toBe(false);
    });

    it('should handle empty array', () => {
      expect(allValid([])).toBe(true);
    });

    it('should handle all invalid', () => {
      const validations = [
        { isValid: false, message: 'Error 1' },
        { isValid: false, message: 'Error 2' },
      ];

      expect(allValid(validations)).toBe(false);
    });
  });

  // ==========================================================================
  // EDGE CASES AND SPECIAL SCENARIOS
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle unicode characters in names', () => {
      const result = validateDisplayName('José García');
      // Current implementation only allows ASCII letters, so this should fail
      expect(result.isValid).toBe(false);
    });

    it('should handle very long inputs gracefully', () => {
      const veryLongString = 'A'.repeat(10000);

      const result = validateEmail(veryLongString);
      expect(result.isValid).toBe(false);
      expect(result).toBeDefined();
    });

    it('should handle null-like values', () => {
      // TypeScript prevents actual null, but test empty string behavior
      expect(validateEmail('')).toHaveProperty('isValid', false);
      expect(validatePassword('')).toHaveProperty('isValid', false);
      expect(validateDisplayName('')).toHaveProperty('isValid', false);
    });

    it('should be consistent across multiple calls', () => {
      const email = 'test@example.com';
      const result1 = validateEmail(email);
      const result2 = validateEmail(email);

      expect(result1).toEqual(result2);
    });
  });
});
