import { Hono } from 'hono';
import { hash, compare } from 'bcryptjs';
import { getPrisma } from '../utils/db';
import { generateToken } from '../utils/jwt';
import { Bindings } from '../index';

const auth = new Hono<{ Bindings: Bindings }>();

// Signup
auth.post('/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();

    // Validation
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET,
      c.env.JWT_EXPIRES_IN
    );

    return c.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          user,
          token,
        },
      },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    console.error('Signup error:', error);
    return c.json({ error: message }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET,
      c.env.JWT_EXPIRES_IN
    );

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    return c.json({ error: message }, 500);
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: currentUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    console.error('Get user error:', error);
    return c.json({ error: message }, 500);
  }
});

export default auth;
