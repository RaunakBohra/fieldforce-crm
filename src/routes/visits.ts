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

/**
 * POST /api/visits/upload-photo
 * Upload photo to R2 and return the R2 object key
 */
visits.post('/upload-photo', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { photo, visitId } = body;

    if (!photo || typeof photo !== 'string') {
      return c.json({ success: false, error: 'Photo data is required' }, 400);
    }

    logger.info('Upload photo request', {
      ...getLogContext(c),
      visitId: visitId || 'new',
      photoSize: photo.length,
    });

    // Extract base64 data
    const base64Data = photo.split(',')[1];
    if (!base64Data) {
      return c.json({ success: false, error: 'Invalid photo format' }, 400);
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique filename
    const timestamp = Date.now();
    const objectKey = `visits/${user.userId}/${timestamp}_${visitId || 'temp'}.jpg`;

    // Upload to R2
    const bucket = c.env.BUCKET;
    await bucket.put(objectKey, binaryData, {
      httpMetadata: {
        contentType: 'image/jpeg',
      },
    });

    logger.info('Photo uploaded successfully', {
      ...getLogContext(c),
      objectKey,
      size: binaryData.length,
    });

    return c.json({
      success: true,
      data: { objectKey },
    }, 200);
  } catch (error: unknown) {
    logger.error('Upload photo failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload photo',
    }, 500);
  }
});

/**
 * POST /api/visits/check-in
 * Check in to a visit (start visit)
 */
visits.post('/check-in', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { contactId, latitude, longitude, locationName } = body;

    if (!contactId) {
      return c.json({ success: false, error: 'Contact ID is required' }, 400);
    }

    logger.info('Check-in request', {
      ...getLogContext(c),
      contactId,
      hasGPS: !!(latitude && longitude),
    });

    // Create visit with check-in time
    const visit = await deps.prisma.visit.create({
      data: {
        contactId,
        fieldRepId: user.userId,
        checkInTime: new Date(),
        status: 'IN_PROGRESS',
        latitude,
        longitude,
        locationName,
        visitDate: new Date(),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            designation: true,
            city: true,
          },
        },
      },
    });

    logger.info('Visit checked in successfully', {
      visitId: visit.id,
      contactId,
      userId: user.userId,
    });

    return c.json({
      success: true,
      data: { visit },
    }, 201);
  } catch (error: unknown) {
    logger.error('Check-in failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in',
    }, 500);
  }
});

/**
 * POST /api/visits/:id/check-out
 * Check out from a visit (complete visit)
 */
visits.post('/:id/check-out', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const visitId = c.req.param('id');

  try {
    const body = await c.req.json();
    const {
      purpose,
      notes,
      outcome,
      products,
      samplesGiven,
      followUpRequired,
      followUpNotes,
      nextVisitDate,
      photos,
    } = body;

    logger.info('Check-out request', {
      ...getLogContext(c),
      visitId,
      hasPhotos: !!photos?.length,
    });

    // Get visit to calculate duration
    const existingVisit = await deps.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!existingVisit) {
      return c.json({ success: false, error: 'Visit not found' }, 404);
    }

    if (existingVisit.fieldRepId !== user.userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    if (!existingVisit.checkInTime) {
      return c.json({ success: false, error: 'Visit was not checked in' }, 400);
    }

    // Calculate duration
    const checkOutTime = new Date();
    const durationMinutes = Math.round(
      (checkOutTime.getTime() - new Date(existingVisit.checkInTime).getTime()) / 1000 / 60
    );

    // Update visit with check-out data
    const visit = await deps.prisma.visit.update({
      where: { id: visitId },
      data: {
        checkOutTime,
        duration: durationMinutes,
        status: 'COMPLETED',
        purpose,
        notes,
        outcome: outcome || 'SUCCESSFUL',
        products: products || [],
        samplesGiven,
        followUpRequired: followUpRequired || false,
        followUpNotes,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : undefined,
        photos: photos || [],
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            designation: true,
            city: true,
          },
        },
      },
    });

    logger.info('Visit checked out successfully', {
      visitId: visit.id,
      duration: durationMinutes,
      userId: user.userId,
    });

    return c.json({
      success: true,
      data: { visit },
    }, 200);
  } catch (error: unknown) {
    logger.error('Check-out failed', error, {
      ...getLogContext(c),
      visitId,
    });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check out',
    }, 500);
  }
});

export default visits;
