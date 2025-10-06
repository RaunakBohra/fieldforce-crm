/**
 * File Validation Utility
 *
 * Provides comprehensive file validation including:
 * - File size limits
 * - MIME type whitelist
 * - Magic bytes verification (prevents file type spoofing)
 * - Filename sanitization
 *
 * Security: Prevents malicious file uploads (OWASP A04)
 */

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicBytes?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Default allowed file types for the application
 */
export const DEFAULT_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const DEFAULT_ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

/**
 * Default size limits
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default

/**
 * Magic bytes (file signatures) for common file types
 * Used to verify actual file type vs claimed MIME type
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG signature
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // "RIFF" - WebP starts with RIFF
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // "%PDF"
  ],
  'application/msword': [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // MS Office compound file
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // ZIP signature (DOCX is a ZIP)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04], // ZIP signature (XLSX is a ZIP)
  ],
};

/**
 * Validate file before upload
 * @param buffer - File buffer (first 8 bytes minimum for magic byte check)
 * @param filename - Original filename
 * @param mimeType - Claimed MIME type
 * @param options - Validation options
 * @returns Validation result
 */
export async function validateFile(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSizeBytes = MAX_FILE_SIZE,
    allowedMimeTypes = [...DEFAULT_ALLOWED_IMAGE_TYPES, ...DEFAULT_ALLOWED_DOCUMENT_TYPES],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    checkMagicBytes = true,
  } = options;

  // 1. Validate file size
  if (buffer.byteLength > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // 2. Validate MIME type
  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type '${mimeType}' not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  // 3. Validate file extension
  const extension = getFileExtension(filename);
  if (!allowedExtensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `File extension '${extension}' not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  // 4. Verify magic bytes (prevents file type spoofing)
  if (checkMagicBytes && MAGIC_BYTES[mimeType]) {
    const bytes = new Uint8Array(buffer);
    const isValid = verifyMagicBytes(bytes, mimeType);

    if (!isValid) {
      return {
        valid: false,
        error: 'File content does not match declared type. Possible file type spoofing detected.',
      };
    }
  }

  // 5. Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Verify file magic bytes match expected signature
 */
function verifyMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    return true; // No signature defined, skip check
  }

  // Check if any signature matches
  return signatures.some((signature) => {
    // Ensure we have enough bytes
    if (bytes.length < signature.length) {
      return false;
    }

    // Check if signature matches
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return filename.substring(lastDot);
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'file';

  // Remove or replace dangerous characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length

  // Ensure file has an extension
  if (!sanitized.includes('.')) {
    return `${sanitized}.bin`;
  }

  return sanitized;
}

/**
 * Generate safe storage key (path) from filename
 */
export function generateStorageKey(filename: string, prefix: string = ''): string {
  const sanitized = sanitizeFilename(filename);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const key = `${prefix}${timestamp}-${randomSuffix}-${sanitized}`;

  // Remove path traversal attempts
  return key.replace(/\.\./g, '').replace(/\/\//g, '/');
}

/**
 * Validate image file specifically
 */
export async function validateImageFile(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<FileValidationResult> {
  return validateFile(buffer, filename, mimeType, {
    maxSizeBytes: MAX_IMAGE_SIZE,
    allowedMimeTypes: DEFAULT_ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    checkMagicBytes: true,
  });
}

/**
 * Validate document file specifically
 */
export async function validateDocumentFile(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<FileValidationResult> {
  return validateFile(buffer, filename, mimeType, {
    maxSizeBytes: MAX_DOCUMENT_SIZE,
    allowedMimeTypes: DEFAULT_ALLOWED_DOCUMENT_TYPES,
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    checkMagicBytes: true,
  });
}
