import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { Bindings, UserContext } from '../index';
import { Dependencies } from '../config/dependencies';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: { deps: Dependencies; user: UserContext } }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  console.log('[AUTH DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');
  console.log('[AUTH DEBUG] Headers:', Object.fromEntries(c.req.raw.headers.entries()));

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH DEBUG] No valid Bearer token in header');
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }

  const token = authHeader.substring(7);
  console.log('[AUTH DEBUG] Token extracted, length:', token.length);

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    console.log('[AUTH DEBUG] Token verified, payload:', payload);

    // Verify user still exists in database
    const deps = c.get('deps');
    const user = await deps.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.log('[AUTH DEBUG] User not found in database');
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    console.log('[AUTH DEBUG] User found, auth successful');
    c.set('user', payload);
    await next();
  } catch (error) {
    console.log('[AUTH DEBUG] Token verification failed:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}
