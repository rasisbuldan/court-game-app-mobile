/**
 * Form Validation Utilities
 *
 * Centralized validation logic with user-friendly, actionable error messages.
 * Ensures consistent validation behavior across all forms.
 */

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns Validation result with user-friendly message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      message: 'Email address is required',
    };
  }

  // Basic email regex that covers most common cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  // Check for common typos
  const domain = email.split('@')[1];
  if (domain && domain.includes('..')) {
    return {
      isValid: false,
      message: 'Email address contains invalid characters',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validates password strength
 * @param password - Password to validate
 * @param minLength - Minimum length requirement (default: 6)
 * @returns Validation result with specific guidance
 */
export function validatePassword(password: string, minLength: number = 6): ValidationResult {
  if (!password || password.trim() === '') {
    return {
      isValid: false,
      message: 'Password is required',
    };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`,
    };
  }

  // Optional: Check for weak passwords
  if (password.toLowerCase() === 'password' || password === '123456') {
    return {
      isValid: false,
      message: 'This password is too common. Please choose a stronger password',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * Validates display name (full name)
 * @param name - Display name to validate
 * @param minLength - Minimum length (default: 2)
 * @param maxLength - Maximum length (default: 50)
 * @returns Validation result
 */
export function validateDisplayName(name: string, minLength: number = 2, maxLength: number = 50): ValidationResult {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: `Name must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: `Name must be ${maxLength} characters or less`,
    };
  }

  // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

/**
 * Validates session name
 * @param name - Session name to validate
 * @param maxLength - Maximum length (default: 60)
 * @returns Validation result
 */
export function validateSessionName(name: string, maxLength: number = 60): ValidationResult {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Session name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: `Session name must be ${maxLength} characters or less`,
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// USERNAME VALIDATION
// ============================================================================

/**
 * Validates username (alphanumeric + underscores)
 * @param username - Username to validate
 * @param minLength - Minimum length (default: 3)
 * @param maxLength - Maximum length (default: 30)
 * @returns Validation result
 */
export function validateUsername(username: string, minLength: number = 3, maxLength: number = 30): ValidationResult {
  if (!username || username.trim() === '') {
    return {
      isValid: false,
      message: 'Username is required',
    };
  }

  const trimmed = username.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: `Username must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: `Username must be ${maxLength} characters or less`,
    };
  }

  // Only allow letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, and underscores',
    };
  }

  // Must start with a letter or number (not underscore)
  if (/^_/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Username must start with a letter or number',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// CLUB NAME VALIDATION
// ============================================================================

/**
 * Validates club name
 * @param name - Club name to validate
 * @param minLength - Minimum length (default: 3)
 * @param maxLength - Maximum length (default: 50)
 * @returns Validation result
 */
export function validateClubName(name: string, minLength: number = 3, maxLength: number = 50): ValidationResult {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Club name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: `Club name must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: `Club name must be ${maxLength} characters or less`,
    };
  }

  // Allow letters, numbers, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Club name can only contain letters, numbers, spaces, hyphens, and underscores',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// BIO/DESCRIPTION VALIDATION
// ============================================================================

/**
 * Validates bio or description text
 * @param bio - Bio text to validate
 * @param maxLength - Maximum length (default: 200)
 * @param required - Whether bio is required (default: false)
 * @returns Validation result
 */
export function validateBio(bio: string, maxLength: number = 200, required: boolean = false): ValidationResult {
  if (required && (!bio || bio.trim() === '')) {
    return {
      isValid: false,
      message: 'Description is required',
    };
  }

  if (bio && bio.length > maxLength) {
    return {
      isValid: false,
      message: `Description must be ${maxLength} characters or less`,
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validates URL format (for Reclub imports, etc.)
 * @param url - URL to validate
 * @param allowedDomains - Optional array of allowed domains (e.g., ['reclub.co'])
 * @returns Validation result
 */
export function validateUrl(url: string, allowedDomains?: string[]): ValidationResult {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      message: 'URL is required',
    };
  }

  // Basic URL validation
  try {
    const urlObj = new URL(url.trim());

    // Check allowed domains if specified
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        return {
          isValid: false,
          message: `URL must be from ${allowedDomains.join(' or ')}`,
        };
      }
    }

    return {
      isValid: true,
      message: '',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Please enter a valid URL (e.g., https://example.com)',
    };
  }
}

// ============================================================================
// NUMBER VALIDATION
// ============================================================================

/**
 * Validates number within range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): ValidationResult {
  if (value < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min}`,
    };
  }

  if (value > max) {
    return {
      isValid: false,
      message: `${fieldName} must be ${max} or less`,
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// PLAYER NAME VALIDATION (Session Creation)
// ============================================================================

/**
 * Validates player name in session creation
 * @param name - Player name to validate
 * @param existingNames - Array of existing player names to check for duplicates
 * @returns Validation result
 */
export function validatePlayerName(name: string, existingNames: string[] = []): ValidationResult {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Player name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      message: 'Player name must be at least 2 characters',
    };
  }

  if (trimmed.length > 30) {
    return {
      isValid: false,
      message: 'Player name must be 30 characters or less',
    };
  }

  // Check for duplicate (case-insensitive)
  const isDuplicate = existingNames.some(
    existing => existing.toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return {
      isValid: false,
      message: `"${trimmed}" has already been added`,
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// RECLUB URL VALIDATION
// ============================================================================

/**
 * Validates Reclub event URL
 * @param url - Reclub URL to validate
 * @returns Validation result
 */
export function validateReclubUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      message: 'Please enter a Reclub event URL',
    };
  }

  // Check if it's a valid Reclub URL
  const reclubPattern = /^https?:\/\/(www\.)?reclub\.co\//i;

  if (!reclubPattern.test(url.trim())) {
    return {
      isValid: false,
      message: 'Please enter a valid Reclub URL (e.g., https://reclub.co/m/...)',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates multiple fields and returns first error
 * @param validations - Array of validation results
 * @returns First error message or empty string if all valid
 */
export function getFirstError(validations: ValidationResult[]): string {
  const firstError = validations.find(v => !v.isValid);
  return firstError?.message || '';
}

/**
 * Checks if all validations passed
 * @param validations - Array of validation results
 * @returns True if all validations passed
 */
export function allValid(validations: ValidationResult[]): boolean {
  return validations.every(v => v.isValid);
}
