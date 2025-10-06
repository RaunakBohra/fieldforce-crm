import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { ZodError } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import {
  createVisitSchema,
  updateVisitSchema,
  visitQuerySchema,
} from '../validators/visitSchemas';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Visit Routes
 * Handles all visit management endpoints
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const visits = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All visit routes require authentication
visits.use('/*', authMiddleware);

/**
 * GET /api/visits
 * Get all visits with pagination and filtering
 */
visits.get('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    // Parse and validate query parameters
    const query = visitQuerySchema.parse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      contactId: c.req.query('contactId'),
      fieldRepId: c.req.query('fieldRepId'),
      visitType: c.req.query('visitType'),
      status: c.req.query('status'),
      outcome: c.req.query('outcome'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      search: c.req.query('search'),
    });

    logger.info('Get visits request', {
      ...getLogContext(c),
      query,
    });

    const result = await deps.visitService.getVisits(user.userId, query);

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

    logger.error('Get visits failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/visits/stats
 * Get visit statistics
 */
visits.get('/stats', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get visit stats request', getLogContext(c));

    const result = await deps.visitService.getVisitStats(user.userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data }, 200);
  } catch (error: unknown) {
    logger.error('Get visit stats failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/visits/:id
 * Get a single visit by ID
 */
visits.get('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const visitId = c.req.param('id');

  try {
    logger.info('Get visit by ID request', {
      ...getLogContext(c),
      visitId,
    });

    const result = await deps.visitService.getVisitById(user.userId, visitId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({ success: true, data: result.data }, 200);
  } catch (error: unknown) {
    logger.error('Get visit by ID failed', error, {
      ...getLogContext(c),
      visitId,
    });
    throw error;
  }
});

/**
 * POST /api/visits
 * Create a new visit
 */
visits.post('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const input = createVisitSchema.parse(body);

    logger.info('Create visit request', {
      ...getLogContext(c),
      contactId: input.contactId,
      visitType: input.visitType,
      status: input.status,
    });

    const result = await deps.visitService.createVisit(user.userId, input);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    logger.info('Visit created successfully', {
      visitId: result.data?.id,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Visit created successfully',
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

    logger.error('Create visit failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * PUT /api/visits/:id
 * Update a visit
 */
visits.put('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const visitId = c.req.param('id');

  try {
    const body = await c.req.json();
    const input = updateVisitSchema.parse(body);

    logger.info('Update visit request', {
      ...getLogContext(c),
      visitId,
    });

    const result = await deps.visitService.updateVisit(user.userId, visitId, input);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    logger.info('Visit updated successfully', {
      visitId,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Visit updated successfully',
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

    logger.error('Update visit failed', error, {
      ...getLogContext(c),
      visitId,
    });
    throw error;
  }
});

/**
 * DELETE /api/visits/:id
 * Delete a visit
 */
visits.delete('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const visitId = c.req.param('id');

  try {
    logger.info('Delete visit request', {
      ...getLogContext(c),
      visitId,
    });

    const result = await deps.visitService.deleteVisit(user.userId, visitId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    logger.info('Visit deleted successfully', {
      visitId,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Visit deleted successfully',
      },
      200
    );
  } catch (error: unknown) {
    logger.error('Delete visit failed', error, {
      ...getLogContext(c),
      visitId,
    });
    throw error;
  }
});

export default visits;
