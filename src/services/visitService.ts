import { PrismaClient, Visit, VisitStatus, VisitType, VisitOutcome } from '@prisma/client';
import { CreateVisitInput, UpdateVisitInput, VisitQueryInput } from '../validators/visitSchemas';

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
      console.error('Error creating visit:', error);
      return {
        success: false,
        error: 'Failed to create visit',
      };
    }
  }

  /**
   * Get visits with filters and pagination
   */
  async getVisits(userId: string, query: VisitQueryInput): Promise<VisitsListResult> {
    try {
      const { page = 1, limit = 20, contactId, fieldRepId, visitType, status, outcome, startDate, endDate, search } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        OR: [
          { fieldRepId: userId },
          { contact: { company: { users: { some: { id: userId } } } } },
        ],
      };

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
      console.error('Error getting visits:', error);
      return {
        success: false,
        error: 'Failed to get visits',
      };
    }
  }

  /**
   * Get visit by ID
   */
  async getVisitById(userId: string, visitId: string): Promise<VisitResult> {
    try {
      const visit = await this.prisma.visit.findFirst({
        where: {
          id: visitId,
          OR: [
            { fieldRepId: userId },
            { contact: { company: { users: { some: { id: userId } } } } },
          ],
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
      console.error('Error getting visit:', error);
      return {
        success: false,
        error: 'Failed to get visit',
      };
    }
  }

  /**
   * Update visit
   */
  async updateVisit(userId: string, visitId: string, input: UpdateVisitInput): Promise<VisitResult> {
    try {
      // Verify visit belongs to user
      const existingVisit = await this.prisma.visit.findFirst({
        where: {
          id: visitId,
          fieldRepId: userId,
        },
      });

      if (!existingVisit) {
        return {
          success: false,
          error: 'Visit not found or access denied',
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
      console.error('Error updating visit:', error);
      return {
        success: false,
        error: 'Failed to update visit',
      };
    }
  }

  /**
   * Delete visit
   */
  async deleteVisit(userId: string, visitId: string): Promise<VisitResult> {
    try {
      // Verify visit belongs to user
      const existingVisit = await this.prisma.visit.findFirst({
        where: {
          id: visitId,
          fieldRepId: userId,
        },
      });

      if (!existingVisit) {
        return {
          success: false,
          error: 'Visit not found or access denied',
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
      console.error('Error deleting visit:', error);
      return {
        success: false,
        error: 'Failed to delete visit',
      };
    }
  }

  /**
   * Get visit statistics for dashboard
   */
  async getVisitStats(userId: string): Promise<VisitStatsResult> {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const where = {
        OR: [
          { fieldRepId: userId },
          { contact: { company: { users: { some: { id: userId } } } } },
        ],
      };

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
      console.error('Error getting visit stats:', error);
      return {
        success: false,
        error: 'Failed to get visit statistics',
      };
    }
  }
}
