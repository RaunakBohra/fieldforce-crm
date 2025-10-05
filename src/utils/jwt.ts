import { sign, verify } from 'hono/jwt';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

  return await sign(
    {
      ...payload,
      exp,
    },
    secret
  );
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  try {
    const payload = await verify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
