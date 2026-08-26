import { createClient } from '@neondatabase/neon-js';

const ADMIN_EMAIL = 'alissoncrpay@gmail.com';

const client = createClient({
  auth: {
    url: 'https://ep-calm-shape-aux4hut6.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth',
  },
  dataApi: {
    url: 'https://ep-calm-shape-aux4hut6.apirest.c-10.us-east-1.aws.neon.tech/neondb/rest/v1',
  },
});

const originalSignInEmail = client.auth.signIn.email.bind(client.auth.signIn);
const originalSignUpEmail = client.auth.signUp.email.bind(client.auth.signUp);

client.auth.signIn.email = async (payload) => {
  const email = String(payload?.email || '').trim();
  const result = await originalSignInEmail({ ...payload, email });

  if (!result?.error || email.toLowerCase() !== ADMIN_EMAIL) return result;

  const signup = await originalSignUpEmail({
    name: 'Administrador CRPay',
    email,
    password: payload.password,
  });

  if (!signup?.error) return signup;

  return {
    ...result,
    error: signup.error,
  };
};

export const neon = client;
