import { Hono } from 'hono';
import { z } from 'zod';
import { MSG91OTPService } from '../infrastructure/otp/MSG91OTPService';
import { logger } from '../utils/logger';

interface Env {
  MSG91_AUTH_KEY: string;
  MSG91_TEMPLATE_ID?: string;
}

const otp = new Hono<{ Bindings: Env }>();

/**
 * POST /api/otp/send
 * Send OTP to a mobile number
 *
 * Request Body:
 * {
 *   "mobile": "919999999999",  // Phone with country code
 *   "otpLength": 4,             // Optional: 4 or 6 (default: 4)
 *   "otpExpiry": 5              // Optional: minutes (default: 5)
 * }
 */
otp.post('/send', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request
    const schema = z.object({
      mobile: z.string().min(10).max(15).regex(/^\d+$/, 'Mobile number must contain only digits'),
      otpLength: z.number().int().min(4).max(6).optional().default(4),
      otpExpiry: z.number().int().min(1).max(30).optional().default(5),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        400
      );
    }

    const { mobile, otpLength, otpExpiry } = validation.data;

    // Get MSG91 credentials
    const authKey = c.env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('[OTP] MSG91_AUTH_KEY not configured');
      return c.json(
        {
          success: false,
          error: 'OTP service not configured',
        },
        500
      );
    }

    // Initialize OTP service
    const otpService = new MSG91OTPService(authKey, c.env.MSG91_TEMPLATE_ID);

    // Send OTP
    const result = await otpService.sendOTP(mobile, otpLength, otpExpiry);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'Failed to send OTP',
        },
        400
      );
    }

    logger.info('[OTP] OTP sent successfully', {
      mobile: mobile.substring(0, 5) + '***',
      requestId: result.requestId,
    });

    return c.json({
      success: true,
      message: result.message || 'OTP sent successfully',
      requestId: result.requestId,
    });
  } catch (error) {
    logger.error('[OTP] Send OTP error', { error });
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      },
      500
    );
  }
});

/**
 * POST /api/otp/verify
 * Verify OTP code
 *
 * Request Body:
 * {
 *   "mobile": "919999999999",
 *   "otp": "1234"
 * }
 */
otp.post('/verify', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request
    const schema = z.object({
      mobile: z.string().min(10).max(15).regex(/^\d+$/, 'Mobile number must contain only digits'),
      otp: z.string().length(4).or(z.string().length(6)),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        400
      );
    }

    const { mobile, otp: otpCode } = validation.data;

    // Get MSG91 credentials
    const authKey = c.env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('[OTP] MSG91_AUTH_KEY not configured');
      return c.json(
        {
          success: false,
          error: 'OTP service not configured',
        },
        500
      );
    }

    // Initialize OTP service
    const otpService = new MSG91OTPService(authKey, c.env.MSG91_TEMPLATE_ID);

    // Verify OTP
    const result = await otpService.verifyOTP(mobile, otpCode);

    if (!result.success || !result.verified) {
      return c.json(
        {
          success: false,
          verified: false,
          error: result.error || 'Invalid OTP',
        },
        400
      );
    }

    logger.info('[OTP] OTP verified successfully', {
      mobile: mobile.substring(0, 5) + '***',
    });

    return c.json({
      success: true,
      verified: true,
      mobile: result.mobile,
      message: result.message || 'OTP verified successfully',
    });
  } catch (error) {
    logger.error('[OTP] Verify OTP error', { error });
    return c.json(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      },
      500
    );
  }
});

/**
 * POST /api/otp/verify-token
 * Verify MSG91 widget access token
 * Used when implementing MSG91 OTP widget on frontend
 *
 * Request Body:
 * {
 *   "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
 * }
 */
otp.post('/verify-token', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request
    const schema = z.object({
      accessToken: z.string().min(1),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        400
      );
    }

    const { accessToken } = validation.data;

    // Get MSG91 credentials
    const authKey = c.env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('[OTP] MSG91_AUTH_KEY not configured');
      return c.json(
        {
          success: false,
          error: 'OTP service not configured',
        },
        500
      );
    }

    // Initialize OTP service
    const otpService = new MSG91OTPService(authKey, c.env.MSG91_TEMPLATE_ID);

    // Verify token
    const result = await otpService.verifyAccessToken(accessToken);

    if (!result.success || !result.verified) {
      return c.json(
        {
          success: false,
          verified: false,
          error: result.error || 'Invalid access token',
        },
        400
      );
    }

    logger.info('[OTP] Access token verified successfully', {
      mobile: result.mobile?.substring(0, 5) + '***',
      requestId: result.requestId,
    });

    return c.json({
      success: true,
      verified: true,
      mobile: result.mobile,
      requestId: result.requestId,
      message: result.message || 'Token verified successfully',
    });
  } catch (error) {
    logger.error('[OTP] Verify token error', { error });
    return c.json(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to verify token',
      },
      500
    );
  }
});

/**
 * POST /api/otp/resend
 * Resend OTP to the same mobile number
 *
 * Request Body:
 * {
 *   "mobile": "919999999999",
 *   "retryType": "text"  // Optional: 'text' or 'voice' (default: 'text')
 * }
 */
otp.post('/resend', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request
    const schema = z.object({
      mobile: z.string().min(10).max(15).regex(/^\d+$/, 'Mobile number must contain only digits'),
      retryType: z.enum(['text', 'voice']).optional().default('text'),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        400
      );
    }

    const { mobile, retryType } = validation.data;

    // Get MSG91 credentials
    const authKey = c.env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('[OTP] MSG91_AUTH_KEY not configured');
      return c.json(
        {
          success: false,
          error: 'OTP service not configured',
        },
        500
      );
    }

    // Initialize OTP service
    const otpService = new MSG91OTPService(authKey, c.env.MSG91_TEMPLATE_ID);

    // Resend OTP
    const result = await otpService.resendOTP(mobile, retryType);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'Failed to resend OTP',
        },
        400
      );
    }

    logger.info('[OTP] OTP resent successfully', {
      mobile: mobile.substring(0, 5) + '***',
      retryType,
    });

    return c.json({
      success: true,
      message: result.message || 'OTP resent successfully',
    });
  } catch (error) {
    logger.error('[OTP] Resend OTP error', { error });
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      },
      500
    );
  }
});

export default otp;
