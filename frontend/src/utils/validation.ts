/**
 * Centralized validation utilities for form fields
 * Single Source of Truth for validation rules
 */

export interface ValidationResult {
    isValid: boolean;
    error: string;
}

/**
 * Validates a full name field
 * - Required
 * - Only alphabetic characters and spaces allowed
 */
export const validateName = (value: string): ValidationResult => {
    const trimmed = value.trim();
    if (!trimmed) {
        return { isValid: false, error: 'Full name is required' };
    }
    // Only letters and spaces allowed - no numbers or special characters
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid full name using alphabetic characters only' };
    }
    if (trimmed.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    return { isValid: true, error: '' };
};

/**
 * Validates an email field
 */
export const validateEmail = (value: string): ValidationResult => {
    const trimmed = value.trim();
    if (!trimmed) {
        return { isValid: false, error: 'Email is required' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: '' };
};

/**
 * Validates a mobile number field (10-digit Indian format)
 */
export const validateMobile = (value: string): ValidationResult => {
    const trimmed = value.trim();
    if (!trimmed) {
        return { isValid: false, error: 'Mobile number is required' };
    }
    if (!/^[0-9]{10}$/.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid 10-digit mobile number' };
    }
    return { isValid: true, error: '' };
};

/**
 * Password validation configuration
 * Centralized rules - change here to update everywhere
 */
export const PASSWORD_RULES = {
    minLength: 6,
    // Add more rules here as needed (e.g., requireUppercase, requireNumber)
};

/**
 * Validates a password field
 */
export const validatePassword = (value: string): ValidationResult => {
    if (!value) {
        return { isValid: false, error: 'Password is required' };
    }
    if (value.length < PASSWORD_RULES.minLength) {
        return {
            isValid: false,
            error: `Password must be at least ${PASSWORD_RULES.minLength} characters long`
        };
    }
    return { isValid: true, error: '' };
};

/**
 * Validates password confirmation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }
    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true, error: '' };
};
