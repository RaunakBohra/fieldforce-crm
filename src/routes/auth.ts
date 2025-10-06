import { Hono } from 'hono';
import { signupSchema, loginSchema } from '../validators/authSchemas';
import { authMiddleware } from '../middleware/auth';
import { getCsrfToken } from '../middleware/csrf';
import { loginRateLimiter, signupRateLimiter } from '../middleware/rateLimiter';
import { isAccountLocked, recordFailedLogin, resetLockout, getLockoutMessage } from '../middleware/accountLockout';
import { logger, getLogContext } from '../utils/logger';
import { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';
import { ZodError } from 'zod';

/**
 * Authentication Routes
 * Declarative HTTP layer following hexagonal architecture
 * All business logic delegated to AuthService
 */

const auth = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies } }>();

/**
 * POST /signup
 * Register a new user account
 * Rate limited: 3 signups per hour per IP
 */
auth.post('/signup', signupRateLimiter, async (c) => {
  const deps = c.get('deps');

  try {
    const body = await c.req.json();
    const input = signupSchema.parse(body);

    logger.info('Signup attempt', { ...getLogContext(c), email: input.email });

    const result = await deps.authService.signup(input);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    logger.info('Signup successful', { ...getLogContext(c), userId: result.data?.user.id });

    return c.json(
      {
        success: true,
        message: 'User created successfully',
        data: result.data,
      },
      201
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
        400
      );
    }
    throw error;
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 * Rate limited: 5 attempts per 15 minutes per IP
 */
auth.post('/login', loginRateLimiter, async (c) => {
  const deps = c.get('deps');

  try {
    const body = await c.req.json();
    const input = loginSchema.parse(body);

    // Check if account is locked
    const lockoutStatus = await isAccountLocked(c.env.KV, input.email);
    if (lockoutStatus.locked && lockoutStatus.lockedUntil) {
      logger.warn('Login attempt on locked account', {
        ...getLogContext(c),
        email: input.email,
        lockedUntil: new Date(lockoutStatus.lockedUntil).toISOString(),
      });

      return c.json(
        {
          success: false,
          error: getLockoutMessage(lockoutStatus.lockedUntil),
          lockedUntil: lockoutStatus.lockedUntil,
        },
        403
      );
    }

    logger.info('Login attempt', { ...getLogContext(c), email: input.email });

    const result = await deps.authService.login(input);

    if (!result.success) {
      // Record failed attempt
      const lockout = await recordFailedLogin(c.env.KV, input.email);

      logger.warn('Login failed', {
        ...getLogContext(c),
        email: input.email,
        remainingAttempts: lockout.remainingAttempts,
      });

      return c.json(
        {
          success: false,
          error: result.error,
          remainingAttempts: lockout.remainingAttempts,
        },
        401
      );
    }

    // Reset lockout on successful login
    await resetLockout(c.env.KV, input.email);

    logger.info('Login successful', { ...getLogContext(c), userId: result.data?.user.id });

    return c.json({
      success: true,
      message: 'Login successful',
      data: result.data,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
        400
      );
    }
    throw error;
  }
});

/**
 * GET /me
 * Get current authenticated user details
 * Requires valid JWT token
 */
auth.get('/me', authMiddleware, async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const result = await deps.authService.getCurrentUser(user.userId);

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 404);
  }

  return c.json({
    success: true,
    data: result.data,
  });
});

/**
 * GET /csrf-token
 * Get CSRF token for client
 * Public endpoint (no auth required)
 */
auth.get('/csrf-token', getCsrfToken);

/**
 * POST /logout
 * Invalidate user session
 * Requires valid JWT token
 */
auth.post('/logout', authMiddleware, async (c) => {
  // For JWT-based auth, logout is client-side (remove token)
  // But we log the event for audit purposes
  const user = c.get('user');

  logger.info('User logged out', { ...getLogContext(c), userId: user?.userId });

  return c.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default auth;
