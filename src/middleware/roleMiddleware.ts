import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

/**
 * Role-Based Access Control Middleware
 * Enforces role requirements on protected endpoints
 * Addresses VULN-001: Missing Role-Based Access Control
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'FIELD_REP';

/**
 * Create role middleware that checks if user has required role
 * @param allowedRoles Array of roles that can access the endpoint
 */
export function roleMiddleware(allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      logger.warn('Role check failed: No user context', {
        path: c.req.path,
        method: c.req.method,
      });
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required',
        },
        401
      );
    }

    const userRole = user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role check failed: Insufficient permissions', {
        path: c.req.path,
        method: c.req.method,
        userRole,
        requiredRoles: allowedRoles,
        userId: user.userId,
      });
      return c.json(
        {
          success: false,
          error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`,
        },
        403
      );
    }

    logger.info('Role check passed', {
      path: c.req.path,
      method: c.req.method,
      userRole,
      userId: user.userId,
    });

    await next();
  };
}

/**
 * Predefined role middleware for common scenarios
 */
export const adminOnly = roleMiddleware(['ADMIN']);
export const adminOrManager = roleMiddleware(['ADMIN', 'MANAGER']);
export const allRoles = roleMiddleware(['ADMIN', 'MANAGER', 'FIELD_REP']);
