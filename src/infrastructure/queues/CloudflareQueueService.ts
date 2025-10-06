import { IQueueService, QueueMessage, QueueOptions } from '../../core/ports/IQueueService';
import { logger } from '../../utils/logger';

/**
 * Cloudflare Queue Service Implementation
 * Implements IQueueService using Cloudflare Queues
 * Platform: Cloudflare Workers
 */
export class CloudflareQueueService implements IQueueService {
  constructor(private queue: Queue) {}

  /**
   * Send a message to the queue
   */
  async sendMessage<T>(
    queueName: string,
    message: T,
    options?: QueueOptions
  ): Promise<string> {
    try {
      const messageId = crypto.randomUUID();

      await this.queue.send({
        id: messageId,
        body: JSON.stringify(message),
        timestamp: Date.now(),
        ...(options?.deduplicationId && {
          deduplicationId: options.deduplicationId,
        }),
      });

      return messageId;
    } catch (error: unknown) {
      logger.error('Failed to send message to queue', error, { queueName });
      throw error;
    }
  }

  /**
   * Send multiple messages in batch
   */
  async sendBatch<T>(queueName: string, messages: T[]): Promise<string[]> {
    try {
      const messageIds: string[] = [];

      const batch = messages.map((message) => {
        const id = crypto.randomUUID();
        messageIds.push(id);

        return {
          id,
          body: JSON.stringify(message),
          timestamp: Date.now(),
        };
      });

      await this.queue.sendBatch(batch);

      return messageIds;
    } catch (error: unknown) {
      logger.error('Failed to send batch messages to queue', error, { queueName, count: messages.length });
      throw error;
    }
  }

  /**
   * Receive messages from queue
   * Note: Cloudflare Queues use a consumer pattern, not pull-based
   * This method is for compatibility with the interface
   */
  async receiveMessages<T>(
    queueName: string,
    maxMessages: number = 10
  ): Promise<QueueMessage<T>[]> {
    // Cloudflare Queues don't support polling/pulling messages
    // Messages are pushed to consumers automatically
    // This is a placeholder for interface compatibility
    logger.warn('Cloudflare Queues use push-based consumers, not pull-based', { queueName });
    return [];
  }

  /**
   * Delete a processed message
   * Note: In Cloudflare Queues, messages are auto-acknowledged
   * This is for interface compatibility
   */
  async deleteMessage(queueName: string, messageId: string): Promise<void> {
    // Cloudflare Queues auto-acknowledge messages on successful processing
    // This is a no-op for interface compatibility
    logger.warn('Cloudflare Queues auto-acknowledge messages', { queueName, messageId });
  }

  /**
   * Get queue statistics
   * Note: Cloudflare Queues don't expose metrics via API yet
   * This is a placeholder for interface compatibility
   */
  async getQueueStats(queueName: string): Promise<Record<string, unknown>> {
    // Cloudflare Queues metrics are available in dashboard only
    return {
      queueName,
      note: 'Cloudflare Queues metrics available in dashboard',
    };
  }
}

/**
 * Queue Consumer Handler
 * This is how you consume messages from Cloudflare Queues
 * Export this from your worker to handle queue messages
 *
 * Example:
 * export default {
 *   async queue(batch: MessageBatch, env: Bindings): Promise<void> {
 *     await handleQueueMessages(batch, env);
 *   }
 * }
 */
export async function handleQueueMessages(
  batch: MessageBatch,
  env: Record<string, unknown>
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const body = JSON.parse(message.body as string);

      // Process message based on type
      // Example: send email, process visit data, etc.
      logger.info('Processing queue message', { body });

      // Acknowledge message (automatic on successful completion)
    } catch (error: unknown) {
      logger.error('Failed to process queue message', error);
      // Message will be retried automatically
      throw error;
    }
  }
}
