import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { ICacheService } from '../../core/ports/ICacheService';
import { logger } from '../../utils/logger';

/**
 * Fallback Email Service with Quota Management
 *
 * Automatically switches between email providers based on:
 * 1. Monthly quota limits (free tiers)
 * 2. Provider availability
 * 3. Cost optimization
 *
 * Provider Order:
 * 1. Resend (3,000/month free)
 * 2. Maileroo (1,000/month free)
 * 3. AWS SES (unlimited, pay-as-you-go)
 *
 * Note: MSG91 Email API is template-based only, not suitable for raw HTML
 */
export class FallbackEmailService implements IEmailService {
  private providers: Array<{
    name: string;
    service: IEmailService;
    monthlyQuota: number;
  }>;
  private cache: ICacheService;

  constructor(
    providers: Array<{
      name: string;
      service: IEmailService;
      monthlyQuota: number; // 0 = unlimited
    }>,
    cache: ICacheService
  ) {
    this.providers = providers;
    this.cache = cache;
  }

  /**
   * Send email with automatic fallback
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    for (const provider of this.providers) {
      // Check if provider has quota available
      const hasQuota = await this.checkQuota(provider.name, currentMonth, provider.monthlyQuota);

      if (!hasQuota) {
        logger.warn(`[FallbackEmail] ${provider.name} quota exhausted, trying next provider`);
        continue;
      }

      // Try sending with this provider
      logger.info(`[FallbackEmail] Attempting to send via ${provider.name}`);
      const result = await provider.service.sendEmail(options);

      if (result.success) {
        // Increment usage counter
        await this.incrementUsage(provider.name, currentMonth);
        logger.info(`[FallbackEmail] Email sent successfully via ${provider.name}`, {
          messageId: result.messageId,
        });
        return result;
      }

      // Provider failed, try next
      logger.warn(`[FallbackEmail] ${provider.name} failed: ${result.error}, trying next provider`);
    }

    // All providers failed
    logger.error('[FallbackEmail] All email providers failed');
    return {
      success: false,
      error: 'All email providers failed or quota exhausted',
    };
  }

  /**
   * Check if provider has quota available
   */
  private async checkQuota(
    providerName: string,
    month: string,
    monthlyQuota: number
  ): Promise<boolean> {
    // Unlimited quota (0 = unlimited, e.g., AWS SES)
    if (monthlyQuota === 0) {
      return true;
    }

    const cacheKey = `email-quota:${providerName}:${month}`;
    const usageStr = await this.cache.get(cacheKey);
    const usage = usageStr ? parseInt(usageStr, 10) : 0;

    return usage < monthlyQuota;
  }

  /**
   * Increment usage counter for provider
   */
  private async incrementUsage(providerName: string, month: string): Promise<void> {
    const cacheKey = `email-quota:${providerName}:${month}`;
    const usageStr = await this.cache.get(cacheKey);
    const usage = usageStr ? parseInt(usageStr, 10) : 0;

    // Store with 35-day TTL (covers month + a few extra days)
    await this.cache.set(cacheKey, (usage + 1).toString(), 35 * 24 * 60 * 60);
  }

  /**
   * Get current usage statistics for all providers
   */
  async getUsageStats(): Promise<Record<string, { used: number; quota: number }>> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const stats: Record<string, { used: number; quota: number }> = {};

    for (const provider of this.providers) {
      const cacheKey = `email-quota:${provider.name}:${currentMonth}`;
      const usageStr = await this.cache.get(cacheKey);
      const used = usageStr ? parseInt(usageStr, 10) : 0;

      stats[provider.name] = {
        used,
        quota: provider.monthlyQuota,
      };
    }

    return stats;
  }

  /**
   * Verify connection for all providers
   */
  async verifyConnection(): Promise<boolean> {
    let anyWorking = false;

    for (const provider of this.providers) {
      const isWorking = await provider.service.verifyConnection();
      if (isWorking) {
        anyWorking = true;
        logger.info(`[FallbackEmail] ${provider.name} is working`);
      } else {
        logger.warn(`[FallbackEmail] ${provider.name} is not working`);
      }
    }

    return anyWorking;
  }
}
