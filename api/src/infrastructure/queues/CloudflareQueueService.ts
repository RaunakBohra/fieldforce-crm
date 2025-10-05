/**
 * Cloudflare Queues Service Implementation
 *
 * Production-ready implementation of IQueueService for Cloudflare Queues
 */

import {
  IQueueService,
  QueueName,
  QueueOptions,
} from '../../core/ports/IQueueService';

export class CloudflareQueueService implements IQueueService {
  private queues: Map<QueueName, Queue>;

  constructor(queues: Record<QueueName, Queue>) {
    this.queues = new Map(Object.entries(queues) as [QueueName, Queue][]);
  }

  async sendMessage(
    queueName: QueueName,
    message: any,
    options?: QueueOptions
  ): Promise<void> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    try {
      await queue.send(message, {
        delaySeconds: options?.delaySeconds,
        contentType: 'json',
      });
    } catch (error) {
      console.error(`Cloudflare Queue send error (${queueName}):`, error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendBatch(queueName: QueueName, messages: any[]): Promise<void> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    try {
      // Cloudflare Queues batch API
      await queue.sendBatch(
        messages.map((msg) => ({
          body: msg,
          contentType: 'json',
        }))
      );
    } catch (error) {
      console.error(`Cloudflare Queue batch error (${queueName}):`, error);
      throw new Error(`Failed to send batch: ${error.message}`);
    }
  }

  async scheduleMessage(
    queueName: QueueName,
    message: any,
    delaySeconds: number
  ): Promise<void> {
    await this.sendMessage(queueName, message, { delaySeconds });
  }
}
