/**
 * Role-Based Data Filtering Utilities
 *
 * Centralizes data access logic based on user roles.
 * Implements industry-standard CRM permission model:
 * - SUPER_ADMIN: Access all data across all companies (platform-wide)
 * - ADMIN: Access all data within their company
 * - MANAGER: Access all data within their company (team oversight)
 * - FIELD_REP: Access only their assigned records
 *
 * @module roleFilters
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'FIELD_REP';

export interface UserContext {
  userId: string;
  role: string;
  companyId?: string;
  territoryId?: string;
}

/**
 * Build Prisma where filter for Visit queries based on user role
 *
 * @param user - User context with role and IDs
 * @returns Prisma where clause for Visit model
 *
 * @example
 * const where = buildVisitFilter({ userId: '123', role: 'MANAGER', companyId: 'abc' });
 * const visits = await prisma.visit.findMany({ where });
 */
export function buildVisitFilter(user: UserContext): any {
  const { userId, role, companyId } = user;

  // SUPER_ADMIN: See all visits across all companies
  if (role === 'SUPER_ADMIN') {
    return {};
  }

  // ADMIN & MANAGER: See all visits in their company
  if (role === 'ADMIN' || role === 'MANAGER') {
    if (!companyId) {
      // Fallback: if no company assigned, see only own visits
      return { fieldRepId: userId };
    }

    return {
      OR: [
        { fieldRepId: userId }, // Own visits
        { fieldRep: { companyId } }, // All visits by company users
      ],
    };
  }

  // FIELD_REP: See only their own visits
  return { fieldRepId: userId };
}

/**
 * Build Prisma where filter for Contact queries based on user role
 *
 * @param user - User context with role and IDs
 * @returns Prisma where clause for Contact model
 *
 * @example
 * const where = buildContactFilter({ userId: '123', role: 'ADMIN', companyId: 'abc' });
 * const contacts = await prisma.contact.findMany({ where });
 */
export function buildContactFilter(user: UserContext): any {
  const { userId, role, companyId } = user;

  // SUPER_ADMIN: See all contacts across all companies
  if (role === 'SUPER_ADMIN') {
    return {};
  }

  // ADMIN & MANAGER: See all contacts in their company
  if (role === 'ADMIN' || role === 'MANAGER') {
    if (!companyId) {
      // Fallback: if no company assigned, see only assigned contacts
      return { assignedToId: userId };
    }

    return { companyId };
  }

  // FIELD_REP: See only their assigned contacts
  return { assignedToId: userId };
}

/**
 * Build Prisma where filter for Order queries based on user role
 *
 * @param user - User context with role and IDs
 * @returns Prisma where clause for Order model
 *
 * @example
 * const where = buildOrderFilter({ userId: '123', role: 'MANAGER', companyId: 'abc' });
 * const orders = await prisma.order.findMany({ where });
 */
export function buildOrderFilter(user: UserContext): any {
  const { userId, role, companyId } = user;

  // SUPER_ADMIN: See all orders across all companies
  if (role === 'SUPER_ADMIN') {
    return {};
  }

  // ADMIN & MANAGER: See all orders in their company
  if (role === 'ADMIN' || role === 'MANAGER') {
    if (!companyId) {
      // Fallback: if no company assigned, see only own orders
      return { createdById: userId };
    }

    return {
      OR: [
        { createdById: userId }, // Own orders
        { createdBy: { companyId } }, // All orders by company users
      ],
    };
  }

  // FIELD_REP: See only their own orders
  return { createdById: userId };
}

/**
 * Build Prisma where filter for Payment queries based on user role
 *
 * @param user - User context with role and IDs
 * @returns Prisma where clause for Payment model
 *
 * @example
 * const where = buildPaymentFilter({ userId: '123', role: 'MANAGER', companyId: 'abc' });
 * const payments = await prisma.payment.findMany({ where });
 */
export function buildPaymentFilter(user: UserContext): any {
  const { userId, role, companyId } = user;

  // SUPER_ADMIN: See all payments across all companies
  if (role === 'SUPER_ADMIN') {
    return {};
  }

  // ADMIN & MANAGER: See all payments in their company
  if (role === 'ADMIN' || role === 'MANAGER') {
    if (!companyId) {
      // Fallback: if no company assigned, see only own payments
      return { recordedById: userId };
    }

    return {
      OR: [
        { recordedById: userId }, // Own payments
        { recordedBy: { companyId } }, // All payments by company users
      ],
    };
  }

  // FIELD_REP: See only their own payments
  return { recordedById: userId };
}

/**
 * Check if user can edit/delete a record based on role
 *
 * @param user - User context with role
 * @param recordOwnerId - ID of the user who owns/created the record
 * @param recordCompanyId - Company ID of the record (optional)
 * @returns true if user can modify the record
 *
 * @example
 * if (canModifyRecord(user, visit.fieldRepId, visit.fieldRep.companyId)) {
 *   // Allow edit/delete
 * }
 */
export function canModifyRecord(
  user: UserContext,
  recordOwnerId: string,
  recordCompanyId?: string
): boolean {
  const { userId, role, companyId } = user;

  // SUPER_ADMIN: Can modify any record
  if (role === 'SUPER_ADMIN') {
    return true;
  }

  // ADMIN & MANAGER: Can modify any record in their company
  if (role === 'ADMIN' || role === 'MANAGER') {
    // If user has no company, can only modify own records
    if (!companyId) {
      return recordOwnerId === userId;
    }

    // Can modify if record belongs to same company
    return recordCompanyId === companyId;
  }

  // FIELD_REP: Can only modify their own records
  return recordOwnerId === userId;
}

/**
 * Get user context from Hono context (extracts role and company info)
 *
 * @param c - Hono context
 * @returns UserContext object
 */
export async function getUserContext(c: any): Promise<UserContext> {
  const user = c.get('user');
  const deps = c.get('deps');

  // Fetch user's company ID if not in context
  let companyId: string | undefined = undefined;

  if (user.userId && deps?.prisma) {
    const userData = await deps.prisma.user.findUnique({
      where: { id: user.userId },
      select: { companyId: true, territoryId: true },
    });

    companyId = userData?.companyId || undefined;
  }

  return {
    userId: user.userId,
    role: user.role,
    companyId,
  };
}

/**
 * Check if user has admin or manager privileges
 *
 * @param role - User role
 * @returns true if user is SUPER_ADMIN, ADMIN, or MANAGER
 */
export function isAdminOrManager(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER';
}

/**
 * Check if user has super admin privileges
 *
 * @param role - User role
 * @returns true if user is SUPER_ADMIN
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}
