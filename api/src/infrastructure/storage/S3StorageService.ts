/**
 * AWS S3 Storage Service Implementation
 *
 * Production-ready implementation of IStorageService for AWS S3
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageService,
  UploadOptions,
  StorageObject,
} from '../../core/ports/IStorageService';

export class S3StorageService implements IStorageService {
  private s3: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl?: string;

  constructor(
    bucket: string,
    region: string = 'ap-south-1',
    accessKeyId?: string,
    secretAccessKey?: string,
    publicUrl?: string
  ) {
    this.s3 = new S3Client({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
    this.bucket = bucket;
    this.region = region;
    this.publicUrl = publicUrl;
  }

  async uploadFile(
    key: string,
    file: Buffer | ArrayBuffer,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const body = file instanceof ArrayBuffer ? Buffer.from(file) : file;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: options?.contentType || 'application/octet-stream',
          CacheControl: options?.cacheControl || 'public, max-age=31536000',
          Metadata: options?.metadata || {},
          ACL: options?.isPublic ? 'public-read' : 'private',
        })
      );

      return this.getPublicUrl(key);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async listFiles(prefix: string, limit: number = 100): Promise<StorageObject[]> {
    try {
      const result = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: limit,
        })
      );

      return (
        result.Contents?.map((obj) => ({
          key: obj.Key!,
          size: obj.Size!,
          lastModified: obj.LastModified!,
        })) || []
      );
    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
