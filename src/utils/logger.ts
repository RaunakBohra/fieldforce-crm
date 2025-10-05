import { Context } from 'hono';

/**
 * Logger Utility
 * Replaces console.log/error with structured logging
 * In production, this can be integrated with monitoring services (Sentry, LogRocket, etc.)
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

class Logger {
  private environment: string;

  constructor(environment: string = 'development') {
    this.environment = environment;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown
  ): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      environment: this.environment,
      message,
      ...(context && { context }),
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    return JSON.stringify(logData);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown) {
    const formattedMessage = this.formatMessage(level, message, context, error);

    if (this.environment === 'production') {
      // In production, send to monitoring service
      // For now, still use console but with structured format
      if (level === LogLevel.ERROR) {
        console.error(formattedMessage);
      } else if (level === LogLevel.WARN) {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    } else {
      // In development, use readable format
      const prefix = `[${level}] ${new Date().toISOString()}`;
      if (level === LogLevel.ERROR) {
        console.error(prefix, message, context || '', error || '');
      } else if (level === LogLevel.WARN) {
        console.warn(prefix, message, context || '');
      } else {
        console.log(prefix, message, context || '');
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger(process.env.NODE_ENV || 'development');

/**
 * Helper function to extract log context from Hono context
 */
export function getLogContext(c: Context): LogContext {
  const user = c.get('user');
  return {
    requestId: c.req.header('x-request-id') || crypto.randomUUID(),
    path: c.req.path,
    method: c.req.method,
    ...(user && { userId: user.userId }),
  };
}
