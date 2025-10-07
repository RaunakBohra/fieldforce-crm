import { sign } from 'hono/jwt';

async function generateToken() {
  const secret = 'UGK+vnlFgvWmxgwmVGl0UMMry4s5TZa8KGX0Nwz+tn8=';

  const payload = {
    userId: 'cmgfttpqw0000hz368sebkwns',
    email: 'test@example.com',
    role: 'ADMIN',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
  };

  const token = await sign(payload, secret);
  console.log('Generated JWT Token:');
  console.log(token);
  console.log('\nTest with:');
  console.log(`curl http://localhost:8787/api/analytics/territory-performance -H "Authorization: Bearer ${token}"`);
}

generateToken();
