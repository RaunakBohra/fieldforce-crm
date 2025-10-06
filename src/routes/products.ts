import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { ZodError } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import { z } from 'zod';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Product Routes
 * Handles all product catalog endpoints
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const products = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All product routes require authentication
products.use('/*', authMiddleware);

// Product query schema
const productQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true'),
});

/**
 * GET /api/products
 * Get all products with pagination and filtering
 */
products.get('/', async (c) => {
  const deps = c.get('deps');

  try {
    // Parse and validate query parameters
    const query = productQuerySchema.parse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      category: c.req.query('category'),
      search: c.req.query('search'),
      isActive: c.req.query('isActive'),
    });

    logger.info('Get products request', {
      ...getLogContext(c),
      query,
    });

    // Build where clause
    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    } else {
      where.isActive = true; // Default to active products
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Get products
    const [data, total] = await Promise.all([
      deps.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
      deps.prisma.product.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        products: data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    }, 200);
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

    logger.error('Get products failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
products.get('/:id', async (c) => {
  const deps = c.get('deps');
  const productId = c.req.param('id');

  try {
    logger.info('Get product by ID request', {
      ...getLogContext(c),
      productId,
    });

    const product = await deps.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    return c.json({ success: true, data: product }, 200);
  } catch (error: unknown) {
    logger.error('Get product by ID failed', error, {
      ...getLogContext(c),
      productId,
    });
    throw error;
  }
});

/**
 * GET /api/products/categories/list
 * Get unique product categories
 */
products.get('/categories/list', async (c) => {
  const deps = c.get('deps');

  try {
    logger.info('Get product categories request', getLogContext(c));

    const categories = await deps.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return c.json({
      success: true,
      data: categories.map(c => c.category),
    }, 200);
  } catch (error: unknown) {
    logger.error('Get product categories failed', error, getLogContext(c));
    throw error;
  }
});

export default products;
