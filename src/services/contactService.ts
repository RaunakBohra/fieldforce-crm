import { PrismaClient, Contact, ContactType, VisitFrequency } from '@prisma/client';
import { logger } from '../utils/logger';
import { buildContactFilter, canModifyRecord, type UserContext } from '../utils/roleFilters';
import type {
  CreateContactInput,
  UpdateContactInput,
  ContactQueryParams,
} from '../validators/contactSchemas';

/**
 * Contact Service
 * Business logic for contact management
 * Following hexagonal architecture - platform-agnostic
 */

export interface ContactResult {
  success: boolean;
  data?: Contact;
  error?: string;
}

export interface ContactListResult {
  success: boolean;
  data?: {
    contacts: Contact[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export class ContactService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new contact
   */
  async createContact(
    input: CreateContactInput,
    userId: string
  ): Promise<ContactResult> {
    try {
      // Get user to check company assignment
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Prepare contact data
      const contactData: {
        name: string;
        contactType: ContactType;
        assignedToId: string;
        companyId?: string;
        territoryId?: string;
        designation?: string;
        specialty?: string;
        phone?: string;
        email?: string;
        alternatePhone?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        hospitalName?: string;
        clinicName?: string;
        licenseNumber?: string;
        visitFrequency: VisitFrequency;
        preferredDay?: string;
        preferredTime?: string;
        nextVisitDate?: Date;
        notes?: string;
        tags: string[];
        isActive: boolean;
      } = {
        name: input.name,
        contactType: input.contactType as ContactType,
        assignedToId: userId,
        companyId: user.companyId || undefined,
        visitFrequency: input.visitFrequency as VisitFrequency,
        tags: input.tags || [],
        isActive: input.isActive ?? true,
      };

      // Add territoryId if provided (validate it exists and is active)
      if (input.territoryId && input.territoryId.trim()) {
        const territory = await prisma.territory.findUnique({
          where: { id: input.territoryId },
          select: { id: true, isActive: true },
        });

        if (!territory) {
          return { success: false, error: 'Territory not found' };
        }

        if (!territory.isActive) {
          return { success: false, error: 'Territory is not active' };
        }

        contactData.territoryId = input.territoryId;
      }

      // Add optional fields (convert empty strings to undefined)
      if (input.designation && input.designation.trim()) {
        contactData.designation = input.designation;
      }
      if (input.specialty && input.specialty.trim()) {
        contactData.specialty = input.specialty;
      }
      if (input.phone && input.phone.trim()) {
        contactData.phone = input.phone;
      }
      if (input.email && input.email.trim()) {
        contactData.email = input.email;
      }
      if (input.alternatePhone && input.alternatePhone.trim()) {
        contactData.alternatePhone = input.alternatePhone;
      }
      if (input.address && input.address.trim()) {
        contactData.address = input.address;
      }
      if (input.city && input.city.trim()) {
        contactData.city = input.city;
      }
      if (input.state && input.state.trim()) {
        contactData.state = input.state;
      }
      if (input.pincode && input.pincode.trim()) {
        contactData.pincode = input.pincode;
      }
      if (input.hospitalName && input.hospitalName.trim()) {
        contactData.hospitalName = input.hospitalName;
      }
      if (input.clinicName && input.clinicName.trim()) {
        contactData.clinicName = input.clinicName;
      }
      if (input.licenseNumber && input.licenseNumber.trim()) {
        contactData.licenseNumber = input.licenseNumber;
      }
      if (input.preferredDay && input.preferredDay.trim()) {
        contactData.preferredDay = input.preferredDay;
      }
      if (input.preferredTime && input.preferredTime.trim()) {
        contactData.preferredTime = input.preferredTime;
      }
      if (input.nextVisitDate && input.nextVisitDate.trim()) {
        contactData.nextVisitDate = new Date(input.nextVisitDate);
      }
      if (input.notes && input.notes.trim()) {
        contactData.notes = input.notes;
      }

      const contact = await this.prisma.contact.create({
        data: contactData,
      });

      logger.info('Contact created successfully', {
        contactId: contact.id,
        userId,
      });

      return { success: true, data: contact };
    } catch (error: unknown) {
      logger.error('Failed to create contact', error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contact',
      };
    }
  }

  /**
   * Get all contacts (with pagination and filtering)
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param query - Query parameters for filtering and pagination
   */
  async getContacts(
    userId: string,
    role: string,
    query: ContactQueryParams
  ): Promise<ContactListResult> {
    try {
      const { page, limit, contactType, city, territoryId, isActive, search } = query;

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
      const roleFilter = buildContactFilter(userContext);

      // Build filter conditions with role-based access
      const where: any = { ...roleFilter };

      if (contactType) {
        where.contactType = contactType as ContactType;
      }

      if (city) {
        where.city = city;
      }

      if (territoryId) {
        where.territoryId = territoryId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Search across multiple fields
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { hospitalName: { contains: search, mode: 'insensitive' } },
          { clinicName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.contact.count({ where });

      // Get paginated contacts
      const contacts = await this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        data: {
          contacts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: unknown) {
      logger.error('Failed to get contacts', error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contacts',
      };
    }
  }

  /**
   * Get a single contact by ID
   * @param contactId - Contact ID to retrieve
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async getContactById(contactId: string, userId: string, role: string): Promise<ContactResult> {
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
      const roleFilter = buildContactFilter(userContext);

      const contact = await this.prisma.contact.findFirst({
        where: {
          id: contactId,
          ...roleFilter,
        },
      });

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      return { success: true, data: contact };
    } catch (error: unknown) {
      logger.error('Failed to get contact', error, { contactId, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contact',
      };
    }
  }

  /**
   * Update a contact
   * @param contactId - Contact ID to update
   * @param input - Updated contact data
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async updateContact(
    contactId: string,
    input: UpdateContactInput,
    userId: string,
    role: string
  ): Promise<ContactResult> {
    try {
      // Fetch user's company for permission check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Fetch existing contact with company info
      const existingContact = await this.prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!existingContact) {
        return { success: false, error: 'Contact not found' };
      }

      // Check if user has permission to modify this contact
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };

      if (!canModifyRecord(userContext, existingContact.assignedToId || '', existingContact.companyId || undefined)) {
        return {
          success: false,
          error: 'Access denied - you do not have permission to edit this contact',
        };
      }

      // Prepare update data (convert empty strings to undefined/null)
      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.contactType !== undefined) updateData.contactType = input.contactType;
      if (input.visitFrequency !== undefined) updateData.visitFrequency = input.visitFrequency;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.tags !== undefined) updateData.tags = input.tags;

      // Optional fields - set to null if empty string
      if (input.designation !== undefined) {
        updateData.designation = input.designation.trim() || null;
      }
      if (input.specialty !== undefined) {
        updateData.specialty = input.specialty.trim() || null;
      }
      if (input.phone !== undefined) {
        updateData.phone = input.phone.trim() || null;
      }
      if (input.email !== undefined) {
        updateData.email = input.email.trim() || null;
      }
      if (input.alternatePhone !== undefined) {
        updateData.alternatePhone = input.alternatePhone.trim() || null;
      }
      if (input.address !== undefined) {
        updateData.address = input.address.trim() || null;
      }
      if (input.city !== undefined) {
        updateData.city = input.city.trim() || null;
      }
      if (input.state !== undefined) {
        updateData.state = input.state.trim() || null;
      }
      if (input.pincode !== undefined) {
        updateData.pincode = input.pincode.trim() || null;
      }
      if (input.hospitalName !== undefined) {
        updateData.hospitalName = input.hospitalName.trim() || null;
      }
      if (input.clinicName !== undefined) {
        updateData.clinicName = input.clinicName.trim() || null;
      }
      if (input.licenseNumber !== undefined) {
        updateData.licenseNumber = input.licenseNumber.trim() || null;
      }
      if (input.preferredDay !== undefined) {
        updateData.preferredDay = input.preferredDay.trim() || null;
      }
      if (input.preferredTime !== undefined) {
        updateData.preferredTime = input.preferredTime.trim() || null;
      }
      if (input.lastVisitDate !== undefined) {
        updateData.lastVisitDate = input.lastVisitDate.trim()
          ? new Date(input.lastVisitDate)
          : null;
      }
      if (input.nextVisitDate !== undefined) {
        updateData.nextVisitDate = input.nextVisitDate.trim()
          ? new Date(input.nextVisitDate)
          : null;
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes.trim() || null;
      }

      // Validate territoryId if provided
      if (input.territoryId !== undefined) {
        if (input.territoryId && input.territoryId.trim()) {
          const territory = await this.prisma.territory.findUnique({
            where: { id: input.territoryId },
            select: { id: true, isActive: true },
          });

          if (!territory) {
            return { success: false, error: 'Territory not found' };
          }

          if (!territory.isActive) {
            return { success: false, error: 'Territory is not active' };
          }

          updateData.territoryId = input.territoryId;
        } else {
          // Empty string means remove territory
          updateData.territoryId = null;
        }
      }

      const contact = await this.prisma.contact.update({
        where: { id: contactId },
        data: updateData,
      });

      logger.info('Contact updated successfully', { contactId, userId });

      return { success: true, data: contact };
    } catch (error: unknown) {
      logger.error('Failed to update contact', error, { contactId, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contact',
      };
    }
  }

  /**
   * Delete a contact
   * @param contactId - Contact ID to delete
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async deleteContact(contactId: string, userId: string, role: string): Promise<ContactResult> {
    try {
      // Fetch user's company for permission check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // Fetch existing contact with company info
      const existingContact = await this.prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!existingContact) {
        return { success: false, error: 'Contact not found' };
      }

      // Check if user has permission to delete this contact
      const userContext: UserContext = {
        userId,
        role,
        companyId: user?.companyId,
      };

      if (!canModifyRecord(userContext, existingContact.assignedToId || '', existingContact.companyId || undefined)) {
        return {
          success: false,
          error: 'Access denied - you do not have permission to delete this contact',
        };
      }

      await this.prisma.contact.delete({
        where: { id: contactId },
      });

      logger.info('Contact deleted successfully', { contactId, userId });

      return { success: true };
    } catch (error: unknown) {
      logger.error('Failed to delete contact', error, { contactId, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contact',
      };
    }
  }

  /**
   * Get contact statistics
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async getContactStats(userId: string, role: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      active: number;
      inactive: number;
      byType: Record<string, number>;
    };
    error?: string;
  }> {
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
      const roleFilter = buildContactFilter(userContext);

      const [total, active, byType] = await Promise.all([
        this.prisma.contact.count({ where: roleFilter }),
        this.prisma.contact.count({ where: { ...roleFilter, isActive: true } }),
        this.prisma.contact.groupBy({
          by: ['contactType'],
          where: roleFilter,
          _count: true,
        }),
      ]);

      const byTypeMap: Record<string, number> = {};
      for (const item of byType) {
        byTypeMap[item.contactType] = item._count;
      }

      return {
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          byType: byTypeMap,
        },
      };
    } catch (error: unknown) {
      logger.error('Failed to get contact stats', error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contact stats',
      };
    }
  }

  /**
   * Get contacts with upcoming visits in the next N days
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   * @param days - Number of days to look ahead (default: 7)
   */
  async getUpcomingVisits(userId: string, role: string, days: number = 7): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      contactType: string;
      nextVisitDate: string;
      lastVisitDate: string | null;
    }>;
    error?: string;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);

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
      const roleFilter = buildContactFilter(userContext);

      const contacts = await this.prisma.contact.findMany({
        where: {
          ...roleFilter,
          isActive: true,
          nextVisitDate: {
            gte: today,
            lte: endDate,
          },
        },
        select: {
          id: true,
          name: true,
          contactType: true,
          nextVisitDate: true,
          lastVisitDate: true,
        },
        orderBy: {
          nextVisitDate: 'asc',
        },
        take: 10,
      });

      const formattedContacts = contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        contactType: contact.contactType,
        nextVisitDate: contact.nextVisitDate?.toISOString() || '',
        lastVisitDate: contact.lastVisitDate?.toISOString() || null,
      }));

      return {
        success: true,
        data: formattedContacts,
      };
    } catch (error: unknown) {
      logger.error('Failed to get upcoming visits', error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming visits',
      };
    }
  }

  /**
   * Get contacts with overdue visits
   * @param userId - User ID
   * @param role - User role (SUPER_ADMIN, ADMIN, MANAGER, FIELD_REP)
   */
  async getOverdueVisits(userId: string, role: string): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      contactType: string;
      nextVisitDate: string;
      lastVisitDate: string | null;
      daysPending: number;
    }>;
    error?: string;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
      const roleFilter = buildContactFilter(userContext);

      const contacts = await this.prisma.contact.findMany({
        where: {
          ...roleFilter,
          isActive: true,
          nextVisitDate: {
            lt: today,
          },
        },
        select: {
          id: true,
          name: true,
          contactType: true,
          nextVisitDate: true,
          lastVisitDate: true,
        },
        orderBy: {
          nextVisitDate: 'asc',
        },
        take: 10,
      });

      const formattedContacts = contacts.map(contact => {
        const nextVisit = contact.nextVisitDate || today;
        const daysPending = Math.floor(
          (today.getTime() - nextVisit.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: contact.id,
          name: contact.name,
          contactType: contact.contactType,
          nextVisitDate: contact.nextVisitDate?.toISOString() || '',
          lastVisitDate: contact.lastVisitDate?.toISOString() || null,
          daysPending,
        };
      });

      return {
        success: true,
        data: formattedContacts,
      };
    } catch (error: unknown) {
      logger.error('Failed to get overdue visits', error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get overdue visits',
      };
    }
  }
}
