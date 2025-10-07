/**
 * MSG91 OTP Widget Type Definitions
 * Documentation: https://docs.msg91.com/p/tf9GTextN/e/VtwJlVSIU/MSG91
 */

declare global {
  interface Window {
    initSendOTP: (config: MSG91Config) => void;
    sendOtp: (
      identifier: string,
      success?: (data: MSG91VerifyResponse) => void,
      failure?: (error: MSG91Error) => void
    ) => void;
    verifyOtp: (
      otp: string,
      success?: (data: MSG91VerifyResponse) => void,
      failure?: (error: MSG91Error) => void,
      reqId?: string
    ) => void;
    retryOtp: (
      channel: string | null,
      success?: (data: MSG91VerifyResponse) => void,
      failure?: (error: MSG91Error) => void,
      reqId?: string
    ) => void;
  }
}

/**
 * Configuration for MSG91 OTP widget initialization
 */
export interface MSG91Config {
  /** Widget ID from MSG91 dashboard */
  widgetId: string;
  /** Authentication token from MSG91 dashboard */
  tokenAuth: string;
  /** Phone number or email to send OTP to */
  identifier?: string;
  /** Whether to expose sendOtp, verifyOtp methods on window */
  exposeMethods?: boolean;
  /** Success callback after OTP verification */
  success?: (data: MSG91VerifyResponse) => void;
  /** Failure callback if OTP verification fails */
  failure?: (error: MSG91Error) => void;
}

/**
 * Response from MSG91 after successful OTP verification
 */
export interface MSG91VerifyResponse {
  type?: string;
  message?: string;
  /** Verification token (can be in multiple fields) */
  token?: string;
  accessToken?: string;
  authToken?: string;
  /** Additional data from MSG91 */
  data?: {
    authToken?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Error response from MSG91
 */
export interface MSG91Error {
  type?: string;
  message: string;
  code?: string;
}
