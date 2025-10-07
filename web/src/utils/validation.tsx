/**
 * Common validation utilities for forms
 * Reusable validation functions with consistent error messages
 */

export const validators = {
  required: (value: any, fieldName: string = 'This field'): string => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return '';
  },

  minLength: (value: string, min: number, fieldName: string = 'This field'): string => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return '';
  },

  maxLength: (value: string, max: number, fieldName: string = 'This field'): string => {
    if (value && value.length > max) {
      return `${fieldName} must be less than ${max} characters`;
    }
    return '';
  },

  email: (value: string): string => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  },

  phone: (value: string): string => {
    if (value && !/^[0-9]{10}$/.test(value.replace(/\s/g, ''))) {
      return 'Phone must be a valid 10-digit number';
    }
    return '';
  },

  pincode: (value: string): string => {
    if (value && !/^[0-9]{6}$/.test(value)) {
      return 'Pincode must be 6 digits';
    }
    return '';
  },

  number: (value: any, fieldName: string = 'This field'): string => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return '';
  },

  positiveNumber: (value: any, fieldName: string = 'This field'): string => {
    const num = Number(value);
    if (value && (isNaN(num) || num <= 0)) {
      return `${fieldName} must be a positive number`;
    }
    return '';
  },

  min: (value: any, min: number, fieldName: string = 'This field'): string => {
    const num = Number(value);
    if (value && !isNaN(num) && num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return '';
  },

  max: (value: any, max: number, fieldName: string = 'This field'): string => {
    const num = Number(value);
    if (value && !isNaN(num) && num > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return '';
  },

  gst: (value: string): string => {
    if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
      return 'Invalid GST number format';
    }
    return '';
  },

  url: (value: string): string => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }
    return '';
  },
};

/**
 * Hook for form validation
 * Returns validation state and helper functions
 */
export const useFormValidation = () => {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const setError = (field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const setFieldTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const markAllTouched = (fields: string[]) => {
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);
  };

  const hasErrors = () => Object.keys(fieldErrors).length > 0;

  const resetValidation = () => {
    setFieldErrors({});
    setTouched({});
  };

  return {
    fieldErrors,
    touched,
    setError,
    clearError,
    setFieldTouched,
    markAllTouched,
    hasErrors,
    resetValidation,
    setFieldErrors,
  };
};

// Re-export React for the hook
import React from 'react';

/**
 * Get CSS classes for input field based on validation state
 */
export const getInputClassName = (
  baseClass: string,
  fieldName: string,
  touched: Record<string, boolean>,
  errors: Record<string, string>
): string => {
  const hasError = touched[fieldName] && errors[fieldName];
  return `${baseClass} ${hasError ? 'border-danger-500 focus:ring-danger-500' : ''}`;
};

/**
 * Error message component
 */
export const FieldError: React.FC<{ show: boolean; message: string }> = ({ show, message }) => {
  if (!show || !message) return null;
  return <p className="mt-1 text-sm text-danger-600">{message}</p>;
};
