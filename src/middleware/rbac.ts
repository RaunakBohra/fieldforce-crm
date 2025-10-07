/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Enforces role-based permissions for protected endpoints.
 * Prevents unauthorized access to admin/manager-only operations.
 *
 * Usage:
 * ```typescript
 * import { requireRole, requireAdmin, requireManager } from '../middleware/rbac';
 *
 * // Allow only admins
 * usersRouter.post('/', requireAdmin, async (c) => { ... });
 *
 * // Allow admins and managers
 * ordersRouter.post('/:id/approve', requireManager, async (c) => { ... });
 *
 * // Allow specific roles
 * router.get('/', requireRole(['ADMIN', 'MANAGER']), async (c) => { ... });
 * ```
 */

import { Context, Next } from 'hono';
import { logger, getLogContext } from '../utils/logger';

export type UserRole = 'ADMIN' | 'MANAGER' | 'FIELD_REP';

/**
 * Middleware factory: Requires user to have one of the allowed roles
 * @param allowedRoles - Array of roles that can access this endpoint
 * @returns Hono middleware function
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    // Check if user is authenticated
    if (!user || !user.userId) {
      logger.warn('Unauthorized access attempt - no user context', {
        ...getLogContext(c),
        userId: user?.userId || 'missing',
      });
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    // Check if user has required role
    const userRole = user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Forbidden access attempt - insufficient permissions', {
        ...getLogContext(c),
        userRole,
        requiredRoles: allowedRoles,
      });

      return c.json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole,
        requiredRoles: allowedRoles,
      }, 403);
    }

    // Log successful authorization
    logger.debug('Role authorization successful', {
      ...getLogContext(c),
      userRole,
      allowedRoles,
    });

    await next();
  };
};

/**
 * Convenience middleware: Require ADMIN role only
 * Use for: User management, system settings, critical operations
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Convenience middleware: Require ADMIN or MANAGER role
 * Use for: Approval workflows, team management, reports
 */
export const requireManager = requireRole(['ADMIN', 'MANAGER']);

/**
 * Convenience middleware: Require any authenticated role
 * Use for: General authenticated endpoints (explicitly document intent)
 */
export const requireAuthenticated = requireRole(['ADMIN', 'MANAGER', 'FIELD_REP']);

/**
 * Check if user has specific role (helper function for route handlers)
 * @param c - Hono context
 * @param role - Role to check
 * @returns true if user has the role
 */
export function hasRole(c: Context, role: UserRole): boolean {
  const user = c.get('user');
  return user?.role === role;
}

/**
 * Check if user is admin (helper function for route handlers)
 * @param c - Hono context
 * @returns true if user is admin
 */
export function isAdmin(c: Context): boolean {
  return hasRole(c, 'ADMIN');
}

/**
 * Check if user is manager or admin (helper function for route handlers)
 * @param c - Hono context
 * @returns true if user is manager or admin
 */
export function isManagerOrAdmin(c: Context): boolean {
  const user = c.get('user');
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}
