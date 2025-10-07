import { PrismaClient, Visit, VisitStatus, VisitType, VisitOutcome } from '@prisma/client';
import { CreateVisitInput, UpdateVisitInput, VisitQueryInput } from '../validators/visitSchemas';
import { logger } from '../utils/logger';
import { buildVisitFilter, canModifyRecord, type UserContext } from '../utils/roleFilters';

/**
 * Visit Service Result Interfaces
 */
export interface VisitResult {
  success: boolean;
  data?: Visit;
  error?: string;
}

export interface VisitsListResult {
  success: boolean;
  data?: {
    visits: Visit[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface VisitStatsResult {
  success: boolean;
  data?: {
    totalVisits: number;
    plannedVisits: number;
    completedVisits: number;
    todayVisits: number;
    weekVisits: number;
    monthVisits: number;
    byType: Record<VisitType, number>;
    byOutcome: Record<VisitOutcome, number>;
  };
  error?: string;
}

/**
 * Visit Service
 * Handles all visit-related business logic
 */
export class VisitService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new visit
   */
  async createVisit(userId: string, input: CreateVisitInput): Promise<VisitResult> {
    try {
      // Optimized: Single query with access verification via WHERE clause
      // Relies on foreign key constraint to ensure contact exists
      let visit;
      try {
        visit = await this.prisma.visit.create({
          data: {
            ...input,
            fieldRepId: userId,
            visitDate: input.visitDate ? new Date(input.visitDate) : new Date(),
            nextVisitDate: input.nextVisitDate ? new Date(input.nextVisitDate) : undefined,
          },
          include: {
            contact: true,
            fieldRep: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      } catch (error: any) {
        // Handle foreign key constraint failure
        if (error.code === 'P2003') {
          return {
            success: false,
            error: 'Contact not found',
          };
        }
        throw error;
      }

      // Verify access using the loaded contact data (no extra query needed)
      const contactBelongsToUser = visit.contact.assignedToId === userId;

      if (!contactBelongsToUser) {
        // Only check company access if direct assignment fails
        const hasCompanyAccess = await this.prisma.contact.count({
          where: {
            id: visit.contactId,
            company: { users: { some: { id: userId } } },
          },
        });

        if (hasCompanyAccess === 0) {
          // Delete the visit since access check failed
          await this.prisma.visit.delete({ where: { id: visit.id } });
          return {
            success: false,
            error: 'Access denied to this contact',
          };
        }
      }

      // Update contact's lastVisitDate if visit is completed
      if (visit.status === 'COMPLETED') {
        await this.prisma.contact.update({
          where: { id: visit.contactId },
          data: { lastVisitDate: visit.visitDate },
        });
      }

      // Update contact's nextVisitDate if provided
      if (visit.nextVisitDate) {
        await this.prisma.contact.update({
          where: { id: visit.contactId },
          data: { nextVisitDate: visit.nextVisitDate },
        });
      }

      return {
        success: true,
        data: visit,
      };
    } catch (error) {
      logger.error('Error creating visit', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to create visit',
      };
    }
  }

  /**
   * Get visits with filters and pagination
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param query - Query parameters for filtering and pagination
   */
  async getVisits(userId: string, role: string, query: VisitQueryInput): Promise<VisitsListResult> {
    try {
      const { page = 1, limit = 20, contactId, fieldRepId, visitType, status, outcome, startDate, endDate, search } = query;
      const skip = (page - 1) * limit;

      // Fetch user's company for role-based filtering
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Build role-based access filter
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };
      const roleFilter = buildVisitFilter(userContext);

      // Build where clause with role-based filter
      const where: any = { ...roleFilter };

      if (contactId) where.contactId = contactId;
      if (fieldRepId) where.fieldRepId = fieldRepId;
      if (visitType) where.visitType = visitType;
      if (status) where.status = status;
      if (outcome) where.outcome = outcome;

      if (startDate || endDate) {
        where.visitDate = {};
        if (startDate) where.visitDate.gte = new Date(startDate);
        if (endDate) where.visitDate.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { notes: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { locationName: { contains: search, mode: 'insensitive' } },
          { contact: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get visits and total count
      const [visits, total] = await Promise.all([
        this.prisma.visit.findMany({
          where,
          skip,
          take: limit,
          orderBy: { visitDate: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                specialty: true,
                contactType: true,
                phone: true,
                email: true,
                hospitalName: true,
                clinicName: true,
              },
            },
            fieldRep: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.visit.count({ where }),
      ]);

      return {
        success: true,
        data: {
          visits,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting visits', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to get visits',
      };
    }
  }

  /**
   * Get visit by ID
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param visitId - Visit ID to retrieve
   */
  async getVisitById(userId: string, role: string, visitId: string): Promise<VisitResult> {
    try {
      // Fetch user's company for role-based filtering
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Build role-based access filter
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };
      const roleFilter = buildVisitFilter(userContext);

      const visit = await this.prisma.visit.findFirst({
        where: {
          id: visitId,
          ...roleFilter,
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              designation: true,
              specialty: true,
              contactType: true,
              phone: true,
              email: true,
              hospitalName: true,
              clinicName: true,
              address: true,
              city: true,
              state: true,
            },
          },
          fieldRep: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!visit) {
        return {
          success: false,
          error: 'Visit not found or access denied',
        };
      }

      return {
        success: true,
        data: visit,
      };
    } catch (error) {
      logger.error('Error getting visit', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to get visit',
      };
    }
  }

  /**
   * Update visit
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param visitId - Visit ID to update
   * @param input - Updated visit data
   */
  async updateVisit(userId: string, role: string, visitId: string, input: UpdateVisitInput): Promise<VisitResult> {
    try {
      // Fetch user's company for permission check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Fetch existing visit with field rep info
      const existingVisit = await this.prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          fieldRep: {
            select: { companyId: true },
          },
        },
      });

      if (!existingVisit) {
        return {
          success: false,
          error: 'Visit not found',
        };
      }

      // Check if user has permission to modify this visit
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };

      if (!canModifyRecord(userContext, existingVisit.fieldRepId, existingVisit.fieldRep.companyId)) {
        return {
          success: false,
          error: 'Access denied - you do not have permission to edit this visit',
        };
      }

      // Update visit
      const visit = await this.prisma.visit.update({
        where: { id: visitId },
        data: {
          ...input,
          visitDate: input.visitDate ? new Date(input.visitDate) : undefined,
          nextVisitDate: input.nextVisitDate ? new Date(input.nextVisitDate) : undefined,
        },
        include: {
          contact: true,
          fieldRep: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update contact's lastVisitDate if visit status changed to completed
      if (input.status === 'COMPLETED' && existingVisit.status !== 'COMPLETED') {
        await this.prisma.contact.update({
          where: { id: visit.contactId },
          data: { lastVisitDate: visit.visitDate },
        });
      }

      // Update contact's nextVisitDate if provided
      if (input.nextVisitDate) {
        await this.prisma.contact.update({
          where: { id: visit.contactId },
          data: { nextVisitDate: new Date(input.nextVisitDate) },
        });
      }

      return {
        success: true,
        data: visit,
      };
    } catch (error) {
      logger.error('Error updating visit', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to update visit',
      };
    }
  }

  /**
   * Delete visit
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param visitId - Visit ID to delete
   */
  async deleteVisit(userId: string, role: string, visitId: string): Promise<VisitResult> {
    try {
      // Fetch user's company for permission check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Fetch existing visit with field rep info
      const existingVisit = await this.prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          fieldRep: {
            select: { companyId: true },
          },
        },
      });

      if (!existingVisit) {
        return {
          success: false,
          error: 'Visit not found',
        };
      }

      // Check if user has permission to delete this visit
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };

      if (!canModifyRecord(userContext, existingVisit.fieldRepId, existingVisit.fieldRep.companyId)) {
        return {
          success: false,
          error: 'Access denied - you do not have permission to delete this visit',
        };
      }

      // Delete visit
      const visit = await this.prisma.visit.delete({
        where: { id: visitId },
      });

      return {
        success: true,
        data: visit,
      };
    } catch (error) {
      logger.error('Error deleting visit', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to delete visit',
      };
    }
  }

  /**
   * Get visit statistics for dashboard
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async getVisitStats(userId: string, role: string): Promise<VisitStatsResult> {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch user's company for role-based filtering
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Build role-based access filter
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };
      const where = buildVisitFilter(userContext);

      const [
        totalVisits,
        plannedVisits,
        completedVisits,
        todayVisits,
        weekVisits,
        monthVisits,
        visitsByType,
        visitsByOutcome,
      ] = await Promise.all([
        this.prisma.visit.count({ where }),
        this.prisma.visit.count({ where: { ...where, status: 'PLANNED' } }),
        this.prisma.visit.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.visit.count({ where: { ...where, visitDate: { gte: todayStart } } }),
        this.prisma.visit.count({ where: { ...where, visitDate: { gte: weekStart } } }),
        this.prisma.visit.count({ where: { ...where, visitDate: { gte: monthStart } } }),
        this.prisma.visit.groupBy({
          by: ['visitType'],
          where,
          _count: true,
        }),
        this.prisma.visit.groupBy({
          by: ['outcome'],
          where,
          _count: true,
        }),
      ]);

      const byType = visitsByType.reduce((acc, item) => {
        acc[item.visitType] = item._count;
        return acc;
      }, {} as Record<VisitType, number>);

      const byOutcome = visitsByOutcome.reduce((acc, item) => {
        acc[item.outcome] = item._count;
        return acc;
      }, {} as Record<VisitOutcome, number>);

      return {
        success: true,
        data: {
          totalVisits,
          plannedVisits,
          completedVisits,
          todayVisits,
          weekVisits,
          monthVisits,
          byType,
          byOutcome,
        },
      };
    } catch (error) {
      logger.error('Error getting visit stats', { error: error instanceof Error ? error.message : error });
      return {
        success: false,
        error: 'Failed to get visit statistics',
      };
    }
  }
}
