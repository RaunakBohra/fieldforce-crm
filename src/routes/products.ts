import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { ZodError } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import { z } from 'zod';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';
import { generateSKU } from '../utils/skuGenerator';

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
    const where: {
      category?: string;
      isActive?: boolean;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        sku?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

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
      ] as any;
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

/**
 * GET /api/products/generate-sku
 * Generate next available SKU in MMYY-XXXX format
 */
products.get('/generate-sku', async (c) => {
  const deps = c.get('deps');

  try {
    logger.info('Generate SKU request', getLogContext(c));

    const sku = await generateSKU(deps.prisma);

    return c.json({
      success: true,
      data: { sku },
    }, 200);
  } catch (error: unknown) {
    logger.error('Generate SKU failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/products/barcode/:barcode
 * Lookup product by barcode (for barcode scanner)
 */
products.get('/barcode/:barcode', async (c) => {
  const deps = c.get('deps');
  const barcode = c.req.param('barcode');

  try {
    logger.info('Barcode lookup request', {
      ...getLogContext(c),
      barcode,
    });

    const product = await deps.prisma.product.findFirst({
      where: { barcode },
    });

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    return c.json({ success: true, data: product }, 200);
  } catch (error: unknown) {
    logger.error('Barcode lookup failed', error, {
      ...getLogContext(c),
      barcode,
    });
    throw error;
  }
});

// Product creation schema
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  isActive: z.boolean().optional().default(true),
});

/**
 * POST /api/products
 * Create a new product
 */
products.post('/', requireManager, async (c) => {
  const deps = c.get('deps');

  try {
    const body = await c.req.json();
    const data = createProductSchema.parse(body);

    logger.info('Create product request', {
      ...getLogContext(c),
      data,
    });

    // Check if SKU already exists
    const existing = await deps.prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return c.json({ success: false, error: 'Product with this SKU already exists' }, 409);
    }

    // Create product
    const product = await deps.prisma.product.create({
      data,
    });

    logger.info('Product created successfully', {
      productId: product.id,
      sku: product.sku,
    });

    return c.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    }, 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid product data',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Create product failed', error, getLogContext(c));
    throw error;
  }
});

// Product update schema
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/products/:id
 * Update a product
 */
products.put('/:id', requireManager, async (c) => {
  const deps = c.get('deps');
  const productId = c.req.param('id');

  try {
    const body = await c.req.json();
    const data = updateProductSchema.parse(body);

    logger.info('Update product request', {
      ...getLogContext(c),
      productId,
      data,
    });

    // Check if product exists
    const existing = await deps.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    // Update product
    const product = await deps.prisma.product.update({
      where: { id: productId },
      data,
    });

    return c.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    }, 200);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid product data',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Update product failed', error, {
      ...getLogContext(c),
      productId,
    });
    throw error;
  }
});

/**
 * POST /api/products/:id/image
 * Upload product image to R2 storage
 * Accepts base64 encoded image data
 */
products.post('/:id/image', requireManager, async (c) => {
  const deps = c.get('deps');
  const productId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return c.json({ success: false, error: 'Image data is required' }, 400);
    }

    logger.info('Upload product image request', {
      ...getLogContext(c),
      productId,
      imageSize: image.length,
    });

    // Check if product exists
    const product = await deps.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    // Extract base64 data (supports data URLs like "data:image/jpeg;base64,...")
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    if (!base64Data) {
      return c.json({ success: false, error: 'Invalid image format' }, 400);
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate R2 keys
    const fullImageKey = `products/${productId}/image.jpg`;
    const thumbnailKey = `products/${productId}/thumb.jpg`;

    // Upload full image to R2
    const bucket = c.env.BUCKET;
    await bucket.put(fullImageKey, binaryData, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Create thumbnail (simple resize - in production, use proper image processing)
    // For now, we'll use the same image for thumbnail
    // TODO: Implement proper thumbnail generation with sharp library
    await bucket.put(thumbnailKey, binaryData, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Generate public URLs (use CDN_URL if configured, otherwise use a placeholder)
    // In production, configure CDN_URL in wrangler.toml or set up custom R2 domain
    const cdnUrl = c.env.CDN_URL || 'https://r2.your-domain.com';
    const imageUrl = `${cdnUrl}/${fullImageKey}`;
    const thumbnailUrl = `${cdnUrl}/${thumbnailKey}`;

    // Update product with image URLs
    const updatedProduct = await deps.prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl,
        thumbnailUrl,
      },
    });

    logger.info('Product image uploaded successfully', {
      productId,
      imageUrl,
      thumbnailUrl,
      size: binaryData.length,
    });

    return c.json({
      success: true,
      message: 'Product image uploaded successfully',
      data: updatedProduct,
    }, 200);
  } catch (error: unknown) {
    logger.error('Upload product image failed', error, {
      ...getLogContext(c),
      productId,
    });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    }, 500);
  }
});

/**
 * DELETE /api/products/:id/image
 * Delete product image from R2 storage
 */
products.delete('/:id/image', requireManager, async (c) => {
  const deps = c.get('deps');
  const productId = c.req.param('id');

  try {
    logger.info('Delete product image request', {
      ...getLogContext(c),
      productId,
    });

    // Check if product exists
    const product = await deps.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    if (!product.imageUrl && !product.thumbnailUrl) {
      return c.json({ success: false, error: 'Product has no image to delete' }, 404);
    }

    // Delete from R2
    const bucket = c.env.BUCKET;
    const fullImageKey = `products/${productId}/image.jpg`;
    const thumbnailKey = `products/${productId}/thumb.jpg`;

    await Promise.all([
      bucket.delete(fullImageKey),
      bucket.delete(thumbnailKey),
    ]);

    // Clear image URLs in database
    const updatedProduct = await deps.prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl: null,
        thumbnailUrl: null,
      },
    });

    logger.info('Product image deleted successfully', {
      productId,
    });

    return c.json({
      success: true,
      message: 'Product image deleted successfully',
      data: updatedProduct,
    }, 200);
  } catch (error: unknown) {
    logger.error('Delete product image failed', error, {
      ...getLogContext(c),
      productId,
    });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    }, 500);
  }
});

export default products;
