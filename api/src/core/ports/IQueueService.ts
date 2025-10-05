/**
 * Queue Service Interface
 *
 * Platform-agnostic interface for message queues
 * Implementations: Cloudflare Queues, AWS SQS, BullMQ/Redis
 */

export interface IQueueService {
  /**
   * Send single message to queue
   * @param queueName - Queue identifier
   * @param message - Message data (will be JSON stringified)
   * @param options - Queue options
   */
  sendMessage(
    queueName: QueueName,
    message: any,
    options?: QueueOptions
  ): Promise<void>;

  /**
   * Send batch of messages to queue
   * @param queueName - Queue identifier
   * @param messages - Array of messages
   */
  sendBatch(queueName: QueueName, messages: any[]): Promise<void>;

  /**
   * Schedule message for delayed delivery
   * @param queueName - Queue identifier
   * @param message - Message data
   * @param delaySeconds - Delay in seconds
   */
  scheduleMessage(
    queueName: QueueName,
    message: any,
    delaySeconds: number
  ): Promise<void>;
}

export type QueueName =
  | 'email-queue'
  | 'payment-reminders'
  | 'sms-queue'
  | 'whatsapp-queue'
  | 'analytics-events';

export interface QueueOptions {
  /**
   * Delay before message becomes visible (seconds)
   */
  delaySeconds?: number;

  /**
   * Message deduplication ID (for FIFO queues)
   */
  deduplicationId?: string;

  /**
   * Message group ID (for FIFO queues)
   */
  groupId?: string;

  /**
   * Custom message attributes
   */
  attributes?: Record<string, string>;
}

export interface QueueMessage<T = any> {
  id: string;
  body: T;
  timestamp: Date;
  attributes?: Record<string, string>;
}
