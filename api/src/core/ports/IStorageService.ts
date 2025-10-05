/**
 * Storage Service Interface
 *
 * Platform-agnostic interface for object storage
 * Implementations: R2, S3, GCS, Azure Blob
 */

export interface IStorageService {
  /**
   * Upload file to storage
   * @param key - File path/key (e.g., "visits/123/photo.jpg")
   * @param file - File buffer
   * @param options - Upload options
   * @returns Public URL of uploaded file
   */
  uploadFile(
    key: string,
    file: Buffer | ArrayBuffer,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Delete file from storage
   * @param key - File path/key
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get signed URL for private file access
   * @param key - File path/key
   * @param expiresIn - Expiry in seconds (default: 3600)
   * @returns Signed URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Get public URL for file
   * @param key - File path/key
   * @returns Public URL
   */
  getPublicUrl(key: string): string;

  /**
   * Check if file exists
   * @param key - File path/key
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * List files with prefix
   * @param prefix - Path prefix (e.g., "visits/123/")
   * @param limit - Max results (default: 100)
   */
  listFiles(prefix: string, limit?: number): Promise<StorageObject[]>;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}
