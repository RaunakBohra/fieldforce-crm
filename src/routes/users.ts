import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logger, getLogContext } from '../utils/logger';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';
import bcrypt from 'bcryptjs';

/**
 * User Management Routes
 * Admin-only endpoints for managing users
 * Follows hexagonal architecture - routes only handle HTTP
 */

const users = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All user routes require authentication
users.use('/*', authMiddleware);

/**
 * Middleware to check if user is admin
 */
const adminOnly = async (c: any, next: any) => {
  const user = c.get('user');

  if (user.role !== 'ADMIN') {
    logger.warn('Unauthorized admin access attempt', {
      ...getLogContext(c),
      userId: user.userId,
      role: user.role,
    });
    return c.json({
      success: false,
      error: 'Unauthorized: Admin access required',
    }, 403);
  }

  await next();
};

/**
 * GET /api/users
 * List all users with pagination (Admin/Manager only)
 */
users.get('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    // Only admin and managers can list users
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return c.json({
        success: false,
        error: 'Unauthorized: Admin or Manager access required',
      }, 403);
    }

    logger.info('List users request', getLogContext(c));

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const role = c.req.query('role');
    const search = c.req.query('search');
    const status = c.req.query('status'); // active/inactive

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'active') {
      where.isActive = true;
    }

    const [usersList, total] = await Promise.all([
      deps.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      deps.prisma.user.count({ where }),
    ]);

    logger.info('Users listed successfully', {
      ...getLogContext(c),
      count: usersList.length,
      total,
      page,
    });

    return c.json({
      success: true,
      data: {
        users: usersList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error('List users error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch users',
    }, 500);
  }
});

/**
 * GET /api/users/:id
 * Get single user details
 */
users.get('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const userId = c.req.param('id');

  try {
    // Users can only view their own profile unless they're admin/manager
    if (user.userId !== userId && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return c.json({
        success: false,
        error: 'Unauthorized: Cannot view other users',
      }, 403);
    }

    logger.info('Get user request', { ...getLogContext(c), userId });

    const userDetails = await deps.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userDetails) {
      return c.json({
        success: false,
        error: 'User not found',
      }, 404);
    }

    logger.info('User retrieved successfully', { ...getLogContext(c), userId });

    return c.json({
      success: true,
      data: { user: userDetails },
    });
  } catch (error: any) {
    logger.error('Get user error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch user',
    }, 500);
  }
});

/**
 * POST /api/users
 * Create new user (Admin only)
 */
users.post('/', adminOnly, async (c) => {
  const deps = c.get('deps');

  try {
    const body = await c.req.json();
    const { name, email, password, phone, role } = body;

    logger.info('Create user attempt', { ...getLogContext(c), email });

    // Validate required fields
    if (!name || !email || !password || !role) {
      return c.json({
        success: false,
        error: 'Name, email, password, and role are required',
      }, 400);
    }

    // Check if user already exists
    const existingUser = await deps.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({
        success: false,
        error: 'User with this email already exists',
      }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await deps.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info('User created successfully', {
      ...getLogContext(c),
      userId: newUser.id,
    });

    return c.json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser },
    }, 201);
  } catch (error: any) {
    logger.error('Create user error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to create user',
    }, 500);
  }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
users.put('/:id', adminOnly, async (c) => {
  const deps = c.get('deps');
  const userId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { name, email, phone, role, isActive, password } = body;

    logger.info('Update user attempt', { ...getLogContext(c), userId });

    // Check if user exists
    const existingUser = await deps.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return c.json({
        success: false,
        error: 'User not found',
      }, 404);
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await deps.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info('User updated successfully', {
      ...getLogContext(c),
      userId,
    });

    return c.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error: any) {
    logger.error('Update user error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to update user',
    }, 500);
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (Admin only)
 * We don't actually delete users, just mark them as inactive
 */
users.delete('/:id', adminOnly, async (c) => {
  const deps = c.get('deps');
  const userId = c.req.param('id');
  const currentUser = c.get('user');

  try {
    logger.info('Deactivate user attempt', { ...getLogContext(c), userId });

    // Prevent admin from deactivating themselves
    if (userId === currentUser.userId) {
      return c.json({
        success: false,
        error: 'Cannot deactivate your own account',
      }, 400);
    }

    // Check if user exists
    const existingUser = await deps.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return c.json({
        success: false,
        error: 'User not found',
      }, 404);
    }

    // Deactivate user
    await deps.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    logger.info('User deactivated successfully', {
      ...getLogContext(c),
      userId,
    });

    return c.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error: any) {
    logger.error('Deactivate user error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to deactivate user',
    }, 500);
  }
});

export default users;
