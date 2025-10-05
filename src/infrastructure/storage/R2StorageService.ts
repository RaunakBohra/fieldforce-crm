import { IStorageService, UploadOptions, UploadResult } from '../../core/ports/IStorageService';

/**
 * Cloudflare R2 Storage Service Implementation
 * Implements IStorageService using Cloudflare R2 (S3-compatible)
 * Platform: Cloudflare Workers
 */
export class R2StorageService implements IStorageService {
  constructor(
    private bucket: R2Bucket,
    private cdnUrl?: string // Optional CDN URL for public files
  ) {}

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string,
    file: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const putOptions: R2PutOptions = {
        httpMetadata: {
          contentType: options?.contentType,
          cacheControl: options?.cacheControl,
        },
        customMetadata: options?.metadata,
      };

      await this.bucket.put(key, file, putOptions);

      // Generate public URL if CDN is configured and file is public
      let url: string | undefined;
      if (options?.public && this.cdnUrl) {
        url = `${this.cdnUrl}/${key}`;
      }

      return {
        success: true,
        key,
        url,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      return {
        success: false,
        key,
        error: message,
      };
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
    } catch (error: unknown) {
      console.error('R2 delete error:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for temporary file access
   * Note: R2 doesn't natively support signed URLs like S3
   * For production, implement using Cloudflare Workers + signed tokens
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For now, return CDN URL if available
    // In production, generate a signed token and include it in the URL
    if (this.cdnUrl) {
      const expiry = Date.now() + expiresIn * 1000;
      return `${this.cdnUrl}/${key}?expires=${expiry}`;
    }

    throw new Error('CDN URL not configured for signed URLs');
  }

  /**
   * Check if a file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const object = await this.bucket.head(key);
      return object !== null;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<Record<string, unknown> | null> {
    try {
      const object = await this.bucket.head(key);

      if (!object) {
        return null;
      }

      return {
        key: object.key,
        size: object.size,
        uploaded: object.uploaded,
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
        checksums: object.checksums,
      };
    } catch (error: unknown) {
      console.error('R2 getMetadata error:', error);
      return null;
    }
  }

  /**
   * List files with a prefix
   */
  async listFiles(prefix: string, limit: number = 1000): Promise<string[]> {
    try {
      const listed = await this.bucket.list({
        prefix,
        limit,
      });

      return listed.objects.map((obj) => obj.key);
    } catch (error: unknown) {
      console.error('R2 list error:', error);
      return [];
    }
  }
}
