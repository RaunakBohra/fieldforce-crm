import { logger } from '../../utils/logger';

export interface OTPSendResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  verified?: boolean;
  mobile?: string;
  requestId?: string;
  message?: string;
  error?: string;
}

export interface OTPTokenVerifyResponse {
  success: boolean;
  verified?: boolean;
  mobile?: string;
  requestId?: string;
  message?: string;
  error?: string;
}

/**
 * MSG91 OTP Service
 * Provides OTP send/verify functionality using MSG91 API
 *
 * Features:
 * - Send OTP via SMS
 * - Verify OTP code
 * - Verify access token (for widget-based OTP)
 * - Resend OTP
 *
 * API Documentation: https://docs.msg91.com/p/tf9GTextN/e/qd5SRJBuO/MSG91
 */
export class MSG91OTPService {
  private authKey: string;
  private templateId?: string;

  constructor(authKey: string, templateId?: string) {
    this.authKey = authKey;
    this.templateId = templateId;
  }

  /**
   * Send OTP to a mobile number
   *
   * @param mobile - Phone number with country code (e.g., 919999999999)
   * @param otpLength - OTP length (4 or 6 digits, default: 4)
   * @param otpExpiry - OTP expiry in minutes (default: 5)
   */
  async sendOTP(
    mobile: string,
    otpLength: number = 4,
    otpExpiry: number = 5
  ): Promise<OTPSendResponse> {
    try {
      const url = 'https://control.msg91.com/api/v5/otp';

      const headers = {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      };

      const body: any = {
        mobile,
        otp_length: otpLength,
        otp_expiry: otpExpiry,
      };

      // Add template ID if provided
      if (this.templateId) {
        body.template_id = this.templateId;
      }

      logger.info('[MSG91OTP] Sending OTP', {
        mobile: mobile.substring(0, 5) + '***', // Mask phone number
        otpLength,
        otpExpiry,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91OTP] Send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send OTP',
        };
      }

      logger.info('[MSG91OTP] OTP sent successfully', {
        requestId: data.type || data.request_id,
      });

      return {
        success: true,
        requestId: data.request_id || data.type,
        message: data.message || 'OTP sent successfully',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      logger.error('[MSG91OTP] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify OTP code
   *
   * @param mobile - Phone number with country code
   * @param otp - OTP code entered by user
   */
  async verifyOTP(mobile: string, otp: string): Promise<OTPVerifyResponse> {
    try {
      const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}`;

      const headers = {
        'authkey': this.authKey,
      };

      logger.info('[MSG91OTP] Verifying OTP', {
        mobile: mobile.substring(0, 5) + '***',
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91OTP] Verify failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          verified: false,
          error: data.message || 'OTP verification failed',
        };
      }

      // MSG91 successful verification response:
      // { "type": "success", "message": "OTP verified successfully" }
      const isVerified = data.type === 'success' || data.message?.includes('verified');

      logger.info('[MSG91OTP] OTP verified', {
        verified: isVerified,
      });

      return {
        success: isVerified,
        verified: isVerified,
        mobile,
        message: data.message || 'OTP verified successfully',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      logger.error('[MSG91OTP] Verify error', { error: message });
      return {
        success: false,
        verified: false,
        error: message,
      };
    }
  }

  /**
   * Verify access token from MSG91 widget
   * This is used when implementing MSG91's OTP widget on frontend
   *
   * @param accessToken - JWT token returned by MSG91 widget after successful verification
   */
  async verifyAccessToken(accessToken: string): Promise<OTPTokenVerifyResponse> {
    try {
      const url = 'https://api.msg91.com/api/v5/widget/verifyAccessToken';

      const headers = {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      };

      const body = {
        'access-token': accessToken,
      };

      logger.info('[MSG91OTP] Verifying access token');

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91OTP] Token verify failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          verified: false,
          error: data.message || 'Token verification failed',
        };
      }

      // MSG91 successful response:
      // {
      //   "type": "success",
      //   "message": "Token verified successfully",
      //   "data": {
      //     "mobile": "919999999999",
      //     "requestId": "xxxx",
      //     "verified": true
      //   }
      // }

      const isVerified = data.type === 'success' && data.data?.verified === true;

      logger.info('[MSG91OTP] Token verified', {
        verified: isVerified,
        mobile: data.data?.mobile?.substring(0, 5) + '***',
      });

      return {
        success: isVerified,
        verified: isVerified,
        mobile: data.data?.mobile,
        requestId: data.data?.requestId,
        message: data.message || 'Token verified successfully',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify token';
      logger.error('[MSG91OTP] Token verify error', { error: message });
      return {
        success: false,
        verified: false,
        error: message,
      };
    }
  }

  /**
   * Resend OTP to the same mobile number
   *
   * @param mobile - Phone number with country code
   * @param retryType - Type of retry: 'voice' or 'text' (default: 'text')
   */
  async resendOTP(mobile: string, retryType: 'voice' | 'text' = 'text'): Promise<OTPSendResponse> {
    try {
      const url = `https://control.msg91.com/api/v5/otp/retry?mobile=${mobile}&retrytype=${retryType}`;

      const headers = {
        'authkey': this.authKey,
      };

      logger.info('[MSG91OTP] Resending OTP', {
        mobile: mobile.substring(0, 5) + '***',
        retryType,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91OTP] Resend failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to resend OTP',
        };
      }

      logger.info('[MSG91OTP] OTP resent successfully');

      return {
        success: true,
        message: data.message || 'OTP resent successfully',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      logger.error('[MSG91OTP] Resend error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }
}
