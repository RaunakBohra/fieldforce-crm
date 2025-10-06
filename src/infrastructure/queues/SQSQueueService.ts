import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import { IQueueService, QueueMessage, QueueOptions } from '../../core/ports/IQueueService';
import { logger } from '../../utils/logger';

/**
 * AWS SQS Queue Service Implementation
 * Implements IQueueService using AWS SQS
 * Platform: AWS (Cloudflare Workers compatible via node_compat)
 *
 * FREE TIER: 1 million requests/month (Standard Queue)
 */
export class SQSQueueService implements IQueueService {
  private client: SQSClient;
  private queueUrls: Map<string, string>;

  constructor(region: string = 'ap-south-1', queueUrls: Record<string, string> = {}) {
    this.client = new SQSClient({ region });
    this.queueUrls = new Map(Object.entries(queueUrls));
  }

  /**
   * Get queue URL by name
   */
  private getQueueUrl(queueName: string): string {
    const url = this.queueUrls.get(queueName);
    if (!url) {
      throw new Error(`Queue URL not configured for queue: ${queueName}`);
    }
    return url;
  }

  /**
   * Send a message to SQS queue
   */
  async sendMessage<T>(
    queueName: string,
    message: T,
    options?: QueueOptions
  ): Promise<string> {
    try {
      const queueUrl = this.getQueueUrl(queueName);

      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          id: crypto.randomUUID(),
          body: message,
          timestamp: Date.now(),
        }),
        DelaySeconds: options?.delaySeconds,
        MessageDeduplicationId: options?.deduplicationId,
        MessageGroupId: options?.messageGroupId, // For FIFO queues
      });

      const response = await this.client.send(command);

      return response.MessageId || crypto.randomUUID();
    } catch (error: unknown) {
      logger.error('SQS sendMessage error', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Send multiple messages in batch (max 10 messages per batch)
   */
  async sendBatch<T>(queueName: string, messages: T[]): Promise<string[]> {
    try {
      const queueUrl = this.getQueueUrl(queueName);
      const messageIds: string[] = [];

      // SQS allows max 10 messages per batch
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        const entries = batch.map((message, index) => ({
          Id: `${i + index}`,
          MessageBody: JSON.stringify({
            id: crypto.randomUUID(),
            body: message,
            timestamp: Date.now(),
          }),
        }));

        const command = new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries,
        });

        const response = await this.client.send(command);

        // Collect successful message IDs
        if (response.Successful) {
          for (const success of response.Successful) {
            messageIds.push(success.MessageId || crypto.randomUUID());
          }
        }

        // Log failed messages
        if (response.Failed && response.Failed.length > 0) {
          logger.error('SQS batch send failures', { failed: response.Failed });
        }
      }

      return messageIds;
    } catch (error: unknown) {
      logger.error('SQS sendBatch error', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Receive messages from SQS queue (polling)
   */
  async receiveMessages<T>(
    queueName: string,
    maxMessages: number = 10
  ): Promise<QueueMessage<T>[]> {
    try {
      const queueUrl = this.getQueueUrl(queueName);

      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(maxMessages, 10), // SQS max is 10
        WaitTimeSeconds: 20, // Long polling for efficiency
        VisibilityTimeout: 30, // 30 seconds to process message
      });

      const response = await this.client.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        return [];
      }

      return response.Messages.map((msg) => {
        const parsed = JSON.parse(msg.Body || '{}');
        return {
          id: parsed.id || msg.MessageId || '',
          body: parsed.body,
          timestamp: parsed.timestamp || Date.now(),
          receiptHandle: msg.ReceiptHandle, // Needed for deletion
        };
      });
    } catch (error: unknown) {
      logger.error('SQS receiveMessages error', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  /**
   * Delete a processed message from queue
   */
  async deleteMessage(queueName: string, messageId: string): Promise<void> {
    try {
      const queueUrl = this.getQueueUrl(queueName);

      // messageId here is actually the receiptHandle from receiveMessages
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: messageId,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      logger.error('SQS deleteMessage error', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<Record<string, unknown>> {
    try {
      const queueUrl = this.getQueueUrl(queueName);

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed',
        ],
      });

      const response = await this.client.send(command);

      return {
        queueName,
        queueUrl,
        messagesAvailable:
          parseInt(response.Attributes?.ApproximateNumberOfMessages || '0', 10),
        messagesInFlight:
          parseInt(response.Attributes?.ApproximateNumberOfMessagesNotVisible || '0', 10),
        messagesDelayed:
          parseInt(response.Attributes?.ApproximateNumberOfMessagesDelayed || '0', 10),
      };
    } catch (error: unknown) {
      logger.error('SQS getQueueStats error', { error: error instanceof Error ? error.message : error });
      return {
        queueName,
        error: error instanceof Error ? error.message : 'Failed to get queue stats',
      };
    }
  }
}

/**
 * SQS Message Consumer Pattern
 * Use this pattern to process messages from SQS
 *
 * Example usage in a worker/cron job:
 *
 * ```typescript
 * const sqsService = new SQSQueueService('ap-south-1', {
 *   'email-queue': 'https://sqs.ap-south-1.amazonaws.com/123456789/email-queue'
 * });
 *
 * // Poll for messages
 * const messages = await sqsService.receiveMessages('email-queue', 10);
 *
 * for (const message of messages) {
 *   try {
 *     // Process message
 *     await sendEmail(message.body);
 *
 *     // Delete on success
 *     await sqsService.deleteMessage('email-queue', message.receiptHandle);
 *   } catch (error) {
 *     console.error('Failed to process message:', error);
 *     // Message will return to queue after visibility timeout
 *   }
 * }
 * ```
 */
export async function processSQSMessages<T>(
  queueService: SQSQueueService,
  queueName: string,
  handler: (message: T) => Promise<void>
): Promise<void> {
  const messages = await queueService.receiveMessages<T>(queueName, 10);

  for (const message of messages) {
    try {
      await handler(message.body);

      // Delete message after successful processing
      await queueService.deleteMessage(queueName, message.receiptHandle || message.id);
    } catch (error: unknown) {
      logger.error('Message processing failed', { error: error instanceof Error ? error.message : error });
      // Message will automatically return to queue after visibility timeout
    }
  }
}
