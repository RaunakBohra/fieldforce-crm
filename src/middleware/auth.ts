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
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
