/**
 * Queue Service Interface (Port)
 * Platform-agnostic interface for async job processing
 * Implementations: CloudflareQueueService, SQSQueueService (AWS), etc.
 */

export interface QueueMessage<T = unknown> {
  id: string;
  body: T;
  timestamp: number;
  attempts?: number;
}

export interface QueueOptions {
  delay?: number; // Delay in seconds before message becomes available
  deduplicationId?: string; // For exactly-once processing
}

export interface IQueueService {
  /**
   * Send a message to the queue
   * @param queueName Queue identifier
   * @param message Message payload (will be JSON serialized)
   * @param options Queue options
   * @returns Message ID
   */
  sendMessage<T>(
    queueName: string,
    message: T,
    options?: QueueOptions
  ): Promise<string>;

  /**
   * Send multiple messages in batch (more efficient)
   * @param queueName Queue identifier
   * @param messages Array of messages
   * @returns Array of message IDs
   */
  sendBatch<T>(queueName: string, messages: T[]): Promise<string[]>;

  /**
   * Receive messages from queue
   * @param queueName Queue identifier
   * @param maxMessages Maximum messages to receive (default: 10)
   * @returns Array of messages
   */
  receiveMessages<T>(
    queueName: string,
    maxMessages?: number
  ): Promise<QueueMessage<T>[]>;

  /**
   * Delete a processed message from queue
   * @param queueName Queue identifier
   * @param messageId Message ID to delete
   */
  deleteMessage(queueName: string, messageId: string): Promise<void>;

  /**
   * Get queue statistics
   * @param queueName Queue identifier
   * @returns Queue stats (message count, oldest message age, etc.)
   */
  getQueueStats(queueName: string): Promise<Record<string, unknown>>;
}
