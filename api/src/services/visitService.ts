/**
 * Visit Service - Business Logic
 *
 * Example of platform-agnostic business logic using dependency injection
 * Works on Cloudflare Workers, AWS Lambda, or any platform
 */

import { PrismaClient } from '@prisma/client';
import { IStorageService } from '../core/ports/IStorageService';
import { IQueueService } from '../core/ports/IQueueService';
import { ICacheService } from '../core/ports/ICacheService';

export interface CreateVisitDTO {
  contactId: string;
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
  photos?: File[] | Buffer[];
  duration?: number;
}

export interface Visit {
  id: string;
  contactId: string;
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  notes: string | null;
  photos: string[];
  duration: number | null;
  visitedAt: Date;
  createdAt: Date;
}

/**
 * Visit Service
 *
 * Business logic is 100% platform-agnostic
 * Depends only on interfaces, not implementations
 */
export class VisitService {
  constructor(
    private prisma: PrismaClient,
    private storage: IStorageService,  // ← Interface (not R2 or S3!)
    private queue: IQueueService,      // ← Interface (not Queues or SQS!)
    private cache: ICacheService       // ← Interface (not KV or Redis!)
  ) {}

  /**
   * Create new visit with GPS check-in
   *
   * This method works identically on:
   * - Cloudflare Workers (R2 + Queues + KV)
   * - AWS Lambda (S3 + SQS + Redis)
   * - Local development (Mock services)
   */
  async createVisit(data: CreateVisitDTO): Promise<Visit> {
    // 1. Validate GPS coordinates
    if (!this.isValidCoordinates(data.latitude, data.longitude)) {
      throw new Error('Invalid GPS coordinates');
    }

    // 2. Upload photos to storage (R2 or S3 - doesn't matter!)
    const photoUrls: string[] = [];

    if (data.photos && data.photos.length > 0) {
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        const buffer =
          photo instanceof File ? Buffer.from(await photo.arrayBuffer()) : photo;

        const key = `visits/${data.contactId}/${Date.now()}-${i}.jpg`;

        // Storage interface works the same everywhere!
        const url = await this.storage.uploadFile(key, buffer, {
          contentType: 'image/jpeg',
          metadata: {
            userId: data.userId,
            contactId: data.contactId,
            uploadedAt: new Date().toISOString(),
          },
        });

        photoUrls.push(url);
      }
    }

    // 3. Create visit in database
    const visit = await this.prisma.visit.create({
      data: {
        contactId: data.contactId,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        notes: data.notes,
        photos: photoUrls,
        duration: data.duration,
        visitedAt: new Date(),
      },
    });

    // 4. Queue notification (Cloudflare Queues or SQS - doesn't matter!)
    await this.queue.sendMessage('analytics-events', {
      type: 'VISIT_CREATED',
      visitId: visit.id,
      userId: data.userId,
      contactId: data.contactId,
      timestamp: new Date().toISOString(),
    });

    // 5. Invalidate cache (KV or Redis - doesn't matter!)
    await this.cache.delete(`visits:user:${data.userId}`);
    await this.cache.delete(`visits:contact:${data.contactId}`);

    return visit as Visit;
  }

  /**
   * Get user's visits with caching
   */
  async getUserVisits(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Visit[]> {
    const cacheKey = `visits:user:${userId}:page:${page}`;

    // Try cache first (KV or Redis - doesn't matter!)
    const cached = await this.cache.get<Visit[]>(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return cached;
    }

    // Fetch from database
    const visits = await this.prisma.visit.findMany({
      where: { userId },
      orderBy: { visitedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Cache for 5 minutes
    await this.cache.set(cacheKey, visits, 300);

    return visits as Visit[];
  }

  /**
   * Delete visit and cleanup photos
   */
  async deleteVisit(visitId: string, userId: string): Promise<void> {
    // Fetch visit
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Authorization check
    if (visit.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete photos from storage (R2 or S3 - doesn't matter!)
    if (visit.photos && visit.photos.length > 0) {
      for (const photoUrl of visit.photos) {
        // Extract key from URL
        const key = photoUrl.split('/').slice(-3).join('/');
        await this.storage.deleteFile(key);
      }
    }

    // Delete from database
    await this.prisma.visit.delete({
      where: { id: visitId },
    });

    // Invalidate cache
    await this.cache.delete(`visits:user:${userId}`);
    await this.cache.delete(`visits:contact:${visit.contactId}`);

    // Queue analytics event
    await this.queue.sendMessage('analytics-events', {
      type: 'VISIT_DELETED',
      visitId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate daily visit summary and email to manager
   */
  async generateDailyVisitSummary(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visits = await this.prisma.visit.findMany({
      where: {
        userId,
        visitedAt: {
          gte: today,
        },
      },
      include: {
        contact: true,
      },
    });

    // Queue email (via queue, not directly)
    await this.queue.sendMessage('email-queue', {
      type: 'VISIT_SUMMARY',
      userId,
      date: today.toISOString(),
      visitCount: visits.length,
      visits: visits.map((v) => ({
        contactName: (v.contact as any).name,
        address: v.address,
        time: v.visitedAt,
        notes: v.notes,
      })),
    });
  }

  /**
   * Validate GPS coordinates
   */
  private isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}
