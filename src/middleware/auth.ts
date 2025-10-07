import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { Bindings, UserContext } from '../index';
import { Dependencies } from '../config/dependencies';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: { deps: Dependencies; user: UserContext } }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);

    // Verify user still exists in database
    const deps = c.get('deps');
    const user = await deps.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
