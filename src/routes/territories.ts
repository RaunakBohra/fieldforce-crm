import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logger, getLogContext } from '../utils/logger';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Territory Management Routes
 * Admin-only endpoints for managing territories
 * Follows hexagonal architecture - routes only handle HTTP
 */

const territories = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All territory routes require authentication
territories.use('/*', authMiddleware);

/**
 * Middleware to check if user is admin
 */
const adminOnly = async (c: any, next: any) => {
  const user = c.get('user');

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    logger.warn('Unauthorized territory access attempt', {
      ...getLogContext(c),
      userId: user.userId,
      role: user.role,
    });
    return c.json({
      success: false,
      error: 'Unauthorized: Admin or Manager access required',
    }, 403);
  }

  await next();
};

/**
 * GET /api/territories
 * List all territories with filters and hierarchy
 */
territories.get('/', adminOnly, async (c) => {
  const deps = c.get('deps');

  try {
    logger.info('List territories request', getLogContext(c));

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const country = c.req.query('country');
    const state = c.req.query('state');
    const city = c.req.query('city');
    const type = c.req.query('type');
    const parentId = c.req.query('parentId');
    const isActive = c.req.query('isActive');
    const search = c.req.query('search');

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (country) {
      where.country = country;
    }

    if (state) {
      where.state = state;
    }

    if (city) {
      where.city = city;
    }

    if (type) {
      where.type = type;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [territoriesList, total] = await Promise.all([
      deps.prisma.territory.findMany({
        where,
        skip,
        take: limit,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          _count: {
            select: {
              users: true,
              children: true,
            },
          },
        },
        orderBy: [
          { country: 'asc' },
          { state: 'asc' },
          { city: 'asc' },
          { name: 'asc' },
        ],
      }),
      deps.prisma.territory.count({ where }),
    ]);

    logger.info('Territories listed successfully', {
      ...getLogContext(c),
      count: territoriesList.length,
      total,
      page,
    });

    return c.json({
      success: true,
      data: {
        territories: territoriesList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error('List territories error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch territories',
    }, 500);
  }
});

/**
 * GET /api/territories/:id
 * Get single territory with details
 */
territories.get('/:id', adminOnly, async (c) => {
  const deps = c.get('deps');
  const territoryId = c.req.param('id');

  try {
    logger.info('Get territory request', { ...getLogContext(c), territoryId });

    const territory = await deps.prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!territory) {
      return c.json({
        success: false,
        error: 'Territory not found',
      }, 404);
    }

    logger.info('Territory retrieved successfully', { ...getLogContext(c), territoryId });

    return c.json({
      success: true,
      data: { territory },
    });
  } catch (error: any) {
    logger.error('Get territory error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch territory',
    }, 500);
  }
});

/**
 * POST /api/territories
 * Create new territory
 */
territories.post('/', adminOnly, async (c) => {
  const deps = c.get('deps');

  try {
    const body = await c.req.json();
    const { name, code, description, type, country, state, city, pincode, parentId, isActive } = body;

    logger.info('Create territory attempt', { ...getLogContext(c), code });

    // Validate required fields
    if (!name || !code || !type || !country) {
      return c.json({
        success: false,
        error: 'Name, code, type, and country are required',
      }, 400);
    }

    // Check if code already exists
    const existingTerritory = await deps.prisma.territory.findUnique({
      where: { code },
    });

    if (existingTerritory) {
      return c.json({
        success: false,
        error: 'Territory with this code already exists',
      }, 400);
    }

    // If parentId provided, validate it exists
    if (parentId) {
      const parentTerritory = await deps.prisma.territory.findUnique({
        where: { id: parentId },
      });

      if (!parentTerritory) {
        return c.json({
          success: false,
          error: 'Parent territory not found',
        }, 404);
      }
    }

    // Create territory
    const newTerritory = await deps.prisma.territory.create({
      data: {
        name,
        code,
        description: description || null,
        type,
        country,
        state: state || null,
        city: city || null,
        pincode: pincode || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    logger.info('Territory created successfully', {
      ...getLogContext(c),
      territoryId: newTerritory.id,
    });

    return c.json({
      success: true,
      message: 'Territory created successfully',
      data: { territory: newTerritory },
    }, 201);
  } catch (error: any) {
    logger.error('Create territory error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to create territory',
    }, 500);
  }
});

/**
 * PUT /api/territories/:id
 * Update territory
 */
territories.put('/:id', adminOnly, async (c) => {
  const deps = c.get('deps');
  const territoryId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { name, code, description, type, country, state, city, pincode, parentId, isActive } = body;

    logger.info('Update territory attempt', { ...getLogContext(c), territoryId });

    // Check if territory exists
    const existingTerritory = await deps.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!existingTerritory) {
      return c.json({
        success: false,
        error: 'Territory not found',
      }, 404);
    }

    // If code is being changed, check it's not already taken
    if (code && code !== existingTerritory.code) {
      const codeExists = await deps.prisma.territory.findUnique({
        where: { code },
      });

      if (codeExists) {
        return c.json({
          success: false,
          error: 'Territory with this code already exists',
        }, 400);
      }
    }

    // If parentId provided, validate it exists and prevent circular reference
    if (parentId) {
      if (parentId === territoryId) {
        return c.json({
          success: false,
          error: 'Territory cannot be its own parent',
        }, 400);
      }

      const parentTerritory = await deps.prisma.territory.findUnique({
        where: { id: parentId },
      });

      if (!parentTerritory) {
        return c.json({
          success: false,
          error: 'Parent territory not found',
        }, 404);
      }
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update territory
    const updatedTerritory = await deps.prisma.territory.update({
      where: { id: territoryId },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
    });

    logger.info('Territory updated successfully', {
      ...getLogContext(c),
      territoryId,
    });

    return c.json({
      success: true,
      message: 'Territory updated successfully',
      data: { territory: updatedTerritory },
    });
  } catch (error: any) {
    logger.error('Update territory error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to update territory',
    }, 500);
  }
});

/**
 * DELETE /api/territories/:id
 * Delete territory (only if no users or children)
 */
territories.delete('/:id', adminOnly, async (c) => {
  const deps = c.get('deps');
  const territoryId = c.req.param('id');

  try {
    logger.info('Delete territory attempt', { ...getLogContext(c), territoryId });

    // Check if territory exists
    const territory = await deps.prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
    });

    if (!territory) {
      return c.json({
        success: false,
        error: 'Territory not found',
      }, 404);
    }

    // Prevent deletion if territory has users
    if (territory._count.users > 0) {
      return c.json({
        success: false,
        error: `Cannot delete territory with ${territory._count.users} assigned users. Please reassign users first.`,
      }, 400);
    }

    // Prevent deletion if territory has children
    if (territory._count.children > 0) {
      return c.json({
        success: false,
        error: `Cannot delete territory with ${territory._count.children} child territories. Please delete or reassign child territories first.`,
      }, 400);
    }

    // Delete territory
    await deps.prisma.territory.delete({
      where: { id: territoryId },
    });

    logger.info('Territory deleted successfully', {
      ...getLogContext(c),
      territoryId,
    });

    return c.json({
      success: true,
      message: 'Territory deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete territory error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to delete territory',
    }, 500);
  }
});

/**
 * GET /api/territories/:id/users
 * Get all users in a territory
 */
territories.get('/:id/users', adminOnly, async (c) => {
  const deps = c.get('deps');
  const territoryId = c.req.param('id');

  try {
    logger.info('Get territory users request', { ...getLogContext(c), territoryId });

    // Check if territory exists
    const territory = await deps.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!territory) {
      return c.json({
        success: false,
        error: 'Territory not found',
      }, 404);
    }

    // Get users
    const users = await deps.prisma.user.findMany({
      where: { territoryId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    logger.info('Territory users retrieved successfully', {
      ...getLogContext(c),
      territoryId,
      count: users.length,
    });

    return c.json({
      success: true,
      data: {
        territory: {
          id: territory.id,
          name: territory.name,
          code: territory.code,
        },
        users,
      },
    });
  } catch (error: any) {
    logger.error('Get territory users error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch territory users',
    }, 500);
  }
});

/**
 * PUT /api/territories/:id/users/:userId
 * Assign user to territory
 */
territories.put('/:id/users/:userId', adminOnly, async (c) => {
  const deps = c.get('deps');
  const territoryId = c.req.param('id');
  const userId = c.req.param('userId');

  try {
    logger.info('Assign user to territory attempt', { ...getLogContext(c), territoryId, userId });

    // Check if territory exists
    const territory = await deps.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!territory) {
      return c.json({
        success: false,
        error: 'Territory not found',
      }, 404);
    }

    // Check if user exists
    const user = await deps.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({
        success: false,
        error: 'User not found',
      }, 404);
    }

    // Assign user to territory
    const updatedUser = await deps.prisma.user.update({
      where: { id: userId },
      data: { territoryId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        territory: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    logger.info('User assigned to territory successfully', {
      ...getLogContext(c),
      territoryId,
      userId,
    });

    return c.json({
      success: true,
      message: 'User assigned to territory successfully',
      data: { user: updatedUser },
    });
  } catch (error: any) {
    logger.error('Assign user to territory error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to assign user to territory',
    }, 500);
  }
});

export default territories;
