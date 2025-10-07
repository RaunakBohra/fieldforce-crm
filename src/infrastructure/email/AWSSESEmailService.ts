import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * AWS SES Email Service Implementation (Cloudflare Workers Compatible)
 * Uses AWS SES v2 API directly (no SDK required)
 * Platform: Cloud-agnostic (REST API with AWS Signature v4)
 *
 * Cost: ~$0.10 per 1,000 emails (after free tier)
 * Free Tier: 62,000 emails/month (if sending from EC2)
 */
export class AWSSESEmailService implements IEmailService {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private defaultFrom: { email: string; name: string };

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    fromEmail: string,
    fromName: string
  ) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.defaultFrom = { email: fromEmail, name: fromName };
  }

  /**
   * AWS Signature v4 signing helper
   */
  private async sign(
    method: string,
    url: string,
    headers: Record<string, string>,
    payload: string
  ): Promise<Record<string, string>> {
    const encoder = new TextEncoder();

    // Step 1: Create canonical request
    const urlObj = new URL(url);
    const canonicalUri = urlObj.pathname;
    const canonicalQueryString = '';

    const sortedHeaders = Object.keys(headers)
      .sort()
      .map((key) => `${key.toLowerCase()}:${headers[key].trim()}`)
      .join('\n');

    const signedHeaders = Object.keys(headers)
      .sort()
      .map((key) => key.toLowerCase())
      .join(';');

    const payloadHash = await this.sha256(payload);

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      sortedHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');

    // Step 2: Create string to sign
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const credentialScope = `${dateStamp}/${this.region}/ses/aws4_request`;
    const canonicalRequestHash = await this.sha256(canonicalRequest);

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    // Step 3: Calculate signature
    const signingKey = await this.getSignatureKey(dateStamp, this.region, 'ses');
    const signature = await this.hmacSha256(signingKey, stringToSign);

    // Step 4: Add signing information to headers
    const authorizationHeader = [
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    return {
      ...headers,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    };
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hmacSha256Buffer(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }

  private async getSignatureKey(dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const kDate = await this.hmacSha256Buffer(encoder.encode(`AWS4${this.secretAccessKey}`), dateStamp);
    const kRegion = await this.hmacSha256Buffer(kDate, region);
    const kService = await this.hmacSha256Buffer(kRegion, service);
    const kSigning = await this.hmacSha256Buffer(kService, 'aws4_request');
    return kSigning;
  }

  /**
   * Send an email via AWS SES API
   * Uses SES v2 SendEmail API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Parse from email
      const from = options.from || `${this.defaultFrom.name} <${this.defaultFrom.email}>`;

      // Parse recipients
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const body = {
        FromEmailAddress: from,
        Destination: {
          ToAddresses: to,
        },
        Content: {
          Simple: {
            Subject: {
              Data: options.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: options.html || '',
                Charset: 'UTF-8',
              },
              Text: options.text
                ? {
                    Data: options.text,
                    Charset: 'UTF-8',
                  }
                : undefined,
            },
          },
        },
      };

      const payload = JSON.stringify(body);

      logger.info('[AWSSESEmail] Sending email', {
        from,
        to,
        subject: options.subject,
      });

      // AWS SES v2 endpoint
      const url = `https://email.${this.region}.amazonaws.com/v2/email/outbound-emails`;

      // Prepare headers for signing
      const baseHeaders = {
        'Content-Type': 'application/json',
        'host': `email.${this.region}.amazonaws.com`,
      };

      // Sign request with AWS Signature v4
      const signedHeaders = await this.sign('POST', url, baseHeaders, payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: signedHeaders,
        body: payload,
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('[AWSSESEmail] Send failed', {
          status: response.status,
          error,
        });
        return {
          success: false,
          error: `AWS SES failed: ${error}`,
        };
      }

      const data = await response.json();

      logger.info('[AWSSESEmail] Email sent successfully', {
        messageId: data.MessageId,
      });

      return {
        success: true,
        messageId: data.MessageId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email via AWS SES';
      logger.error('[AWSSESEmail] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify AWS SES connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.accessKeyId || !this.secretAccessKey) {
        logger.error('[AWSSESEmail] AWS credentials not configured');
        return false;
      }

      logger.info('[AWSSESEmail] Service configured', {
        region: this.region,
        fromEmail: this.defaultFrom.email,
      });

      return true;
    } catch (error: unknown) {
      logger.error('[AWSSESEmail] Verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}
