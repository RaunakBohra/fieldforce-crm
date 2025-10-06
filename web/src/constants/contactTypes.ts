/**
 * Contact type constants - Single source of truth
 * Used across ContactForm, filters, and reports
 */

export const DISTRIBUTION_TYPES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'SUB_SUPER', label: 'Sub Super (Regional)' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'RETAILER', label: 'Retailer' },
] as const;

export const MEDICAL_TYPES = [
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
] as const;

export const VISIT_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

// Type exports for TypeScript
export type DistributionType = typeof DISTRIBUTION_TYPES[number]['value'];
export type MedicalType = typeof MEDICAL_TYPES[number]['value'];
export type VisitFrequency = typeof VISIT_FREQUENCIES[number]['value'];
