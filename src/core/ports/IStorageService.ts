/**
 * Storage Service Interface (Port)
 * Platform-agnostic interface for file storage operations
 * Implementations: R2StorageService (Cloudflare), S3StorageService (AWS), etc.
 */

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  public?: boolean; // If true, file is publicly accessible
}

export interface UploadResult {
  success: boolean;
  key: string;
  url?: string; // Public URL if public: true
  error?: string;
}

export interface IStorageService {
  /**
   * Upload a file to storage
   * @param key Unique file identifier (path)
   * @param file File buffer or stream
   * @param options Upload configuration
   * @returns Upload result with URL
   */
  uploadFile(
    key: string,
    file: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param key File identifier
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get a signed URL for temporary file access
   * @param key File identifier
   * @param expiresIn Expiration time in seconds (default: 3600)
   * @returns Temporary signed URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Check if a file exists
   * @param key File identifier
   * @returns true if file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   * @param key File identifier
   * @returns File metadata (size, contentType, lastModified, etc.)
   */
  getMetadata(key: string): Promise<Record<string, unknown> | null>;

  /**
   * List files with a prefix
   * @param prefix File key prefix
   * @param limit Maximum number of results
   * @returns Array of file keys
   */
  listFiles(prefix: string, limit?: number): Promise<string[]>;
}
