/**
 * Cloudflare R2 Storage Service Implementation
 *
 * Production-ready implementation of IStorageService for R2
 */

import {
  IStorageService,
  UploadOptions,
  StorageObject,
} from '../../core/ports/IStorageService';

export class R2StorageService implements IStorageService {
  private bucket: R2Bucket;
  private publicUrl: string;

  constructor(bucket: R2Bucket, publicUrl: string = 'https://cdn.yourapp.com') {
    this.bucket = bucket;
    this.publicUrl = publicUrl;
  }

  async uploadFile(
    key: string,
    file: Buffer | ArrayBuffer,
    options?: UploadOptions
  ): Promise<string> {
    try {
      await this.bucket.put(key, file, {
        httpMetadata: {
          contentType: options?.contentType || 'application/octet-stream',
          cacheControl: options?.cacheControl || 'public, max-age=31536000',
        },
        customMetadata: options?.metadata || {},
      });

      return this.getPublicUrl(key);
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // R2 public buckets don't need signed URLs
    // For private buckets, you'd implement presigned URLs here
    // For now, return public URL
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const object = await this.bucket.head(key);
      return object !== null;
    } catch (error) {
      return false;
    }
  }

  async listFiles(prefix: string, limit: number = 100): Promise<StorageObject[]> {
    try {
      const listed = await this.bucket.list({
        prefix,
        limit,
      });

      return listed.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
        contentType: obj.httpMetadata?.contentType,
      }));
    } catch (error) {
      console.error('R2 list error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
