import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { ZodError } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import {
  createContactSchema,
  updateContactSchema,
  contactQuerySchema,
} from '../validators/contactSchemas';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Contact Routes
 * Handles all contact management endpoints
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const contacts = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All contact routes require authentication
contacts.use('/*', authMiddleware);

/**
 * GET /api/contacts
 * Get all contacts with pagination and filtering
 */
contacts.get('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    // Parse and validate query parameters
    const query = contactQuerySchema.parse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      contactType: c.req.query('contactType'),
      city: c.req.query('city'),
      territoryId: c.req.query('territoryId'),
      isActive: c.req.query('isActive'),
      search: c.req.query('search'),
    });

    logger.info('Get contacts request', {
      ...getLogContext(c),
      query,
    });

    const result = await deps.contactService.getContacts(user.userId, query);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data }, 200);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid query parameters',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Get contacts failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/contacts/stats
 * Get contact statistics
 */
contacts.get('/stats', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get contact stats request', getLogContext(c));

    const result = await deps.contactService.getContactStats(user.userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data }, 200);
  } catch (error: unknown) {
    logger.error('Get contact stats failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/contacts/:id
 * Get a single contact by ID
 */
contacts.get('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const contactId = c.req.param('id');

  try {
    logger.info('Get contact by ID request', {
      ...getLogContext(c),
      contactId,
    });

    const result = await deps.contactService.getContactById(contactId, user.userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({ success: true, data: result.data }, 200);
  } catch (error: unknown) {
    logger.error('Get contact by ID failed', error, {
      ...getLogContext(c),
      contactId,
    });
    throw error;
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 */
contacts.post('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const input = createContactSchema.parse(body);

    logger.info('Create contact request', {
      ...getLogContext(c),
      contactName: input.name,
      contactType: input.contactType,
    });

    const result = await deps.contactService.createContact(input, user.userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    logger.info('Contact created successfully', {
      contactId: result.data?.id,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Contact created successfully',
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

    logger.error('Create contact failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
contacts.put('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const contactId = c.req.param('id');

  try {
    const body = await c.req.json();
    const input = updateContactSchema.parse(body);

    logger.info('Update contact request', {
      ...getLogContext(c),
      contactId,
    });

    const result = await deps.contactService.updateContact(
      contactId,
      input,
      user.userId
    );

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    logger.info('Contact updated successfully', {
      contactId,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Contact updated successfully',
        data: result.data,
      },
      200
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

    logger.error('Update contact failed', error, {
      ...getLogContext(c),
      contactId,
    });
    throw error;
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
contacts.delete('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const contactId = c.req.param('id');

  try {
    logger.info('Delete contact request', {
      ...getLogContext(c),
      contactId,
    });

    const result = await deps.contactService.deleteContact(contactId, user.userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    logger.info('Contact deleted successfully', {
      contactId,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Contact deleted successfully',
      },
      200
    );
  } catch (error: unknown) {
    logger.error('Delete contact failed', error, {
      ...getLogContext(c),
      contactId,
    });
    throw error;
  }
});

export default contacts;
