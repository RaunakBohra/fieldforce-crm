import { PrismaClient, Contact, ContactType, VisitFrequency } from '@prisma/client';
import { logger } from '../utils/logger';
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
   */
  async getContacts(
    userId: string,
    query: ContactQueryParams
  ): Promise<ContactListResult> {
    try {
      const { page, limit, contactType, city, territoryId, isActive, search } = query;

      // Build filter conditions
      const where: {
        assignedToId: string;
        contactType?: ContactType;
        city?: string;
        territoryId?: string;
        isActive?: boolean;
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          phone?: { contains: string; mode: 'insensitive' };
          email?: { contains: string; mode: 'insensitive' };
          hospitalName?: { contains: string; mode: 'insensitive' };
          clinicName?: { contains: string; mode: 'insensitive' };
        }>;
      } = {
        assignedToId: userId,
      };

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
   */
  async getContactById(contactId: string, userId: string): Promise<ContactResult> {
    try {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: contactId,
          assignedToId: userId, // Ensure user can only access their own contacts
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
   */
  async updateContact(
    contactId: string,
    input: UpdateContactInput,
    userId: string
  ): Promise<ContactResult> {
    try {
      // Check if contact exists and belongs to user
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          id: contactId,
          assignedToId: userId,
        },
      });

      if (!existingContact) {
        return { success: false, error: 'Contact not found' };
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
   */
  async deleteContact(contactId: string, userId: string): Promise<ContactResult> {
    try {
      // Check if contact exists and belongs to user
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          id: contactId,
          assignedToId: userId,
        },
      });

      if (!existingContact) {
        return { success: false, error: 'Contact not found' };
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
   */
  async getContactStats(userId: string): Promise<{
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
      const [total, active, byType] = await Promise.all([
        this.prisma.contact.count({ where: { assignedToId: userId } }),
        this.prisma.contact.count({ where: { assignedToId: userId, isActive: true } }),
        this.prisma.contact.groupBy({
          by: ['contactType'],
          where: { assignedToId: userId },
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
}
