/**
 * AWS SQS Queue Service Implementation
 *
 * Production-ready implementation of IQueueService for AWS SQS
 */

import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import {
  IQueueService,
  QueueName,
  QueueOptions,
} from '../../core/ports/IQueueService';

export class SQSQueueService implements IQueueService {
  private sqs: SQSClient;
  private queueUrls: Map<QueueName, string>;

  constructor(
    region: string = 'ap-south-1',
    queueUrls: Record<QueueName, string>,
    accessKeyId?: string,
    secretAccessKey?: string
  ) {
    this.sqs = new SQSClient({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
    this.queueUrls = new Map(Object.entries(queueUrls) as [QueueName, string][]);
  }

  async sendMessage(
    queueName: QueueName,
    message: any,
    options?: QueueOptions
  ): Promise<void> {
    const queueUrl = this.queueUrls.get(queueName);

    if (!queueUrl) {
      throw new Error(`Queue URL not found for: ${queueName}`);
    }

    try {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
          DelaySeconds: options?.delaySeconds,
          MessageDeduplicationId: options?.deduplicationId,
          MessageGroupId: options?.groupId,
          MessageAttributes: options?.attributes
            ? Object.fromEntries(
                Object.entries(options.attributes).map(([key, value]) => [
                  key,
                  { StringValue: value, DataType: 'String' },
                ])
              )
            : undefined,
        })
      );
    } catch (error) {
      console.error(`SQS send error (${queueName}):`, error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendBatch(queueName: QueueName, messages: any[]): Promise<void> {
    const queueUrl = this.queueUrls.get(queueName);

    if (!queueUrl) {
      throw new Error(`Queue URL not found for: ${queueName}`);
    }

    try {
      // SQS batch limit is 10 messages
      const chunkSize = 10;

      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);

        await this.sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: chunk.map((msg, index) => ({
              Id: `${i + index}`,
              MessageBody: JSON.stringify(msg),
            })),
          })
        );
      }
    } catch (error) {
      console.error(`SQS batch error (${queueName}):`, error);
      throw new Error(`Failed to send batch: ${error.message}`);
    }
  }

  async scheduleMessage(
    queueName: QueueName,
    message: any,
    delaySeconds: number
  ): Promise<void> {
    // SQS max delay is 900 seconds (15 minutes)
    if (delaySeconds > 900) {
      throw new Error('SQS max delay is 900 seconds (15 minutes)');
    }

    await this.sendMessage(queueName, message, { delaySeconds });
  }
}
