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

const originalSignUpEmail = client.auth.signUp.email.bind(client.auth.signUp);

client.auth.signUp.email = async (payload) => {
  const email = String(payload?.email || '').trim();

  if (email.toLowerCase() === ADMIN_EMAIL) {
    return {
      data: null,
      error: {
        message: 'A conta administrativa não pode ser criada pela tela pública.',
      },
    };
  }

  return originalSignUpEmail({ ...payload, email });
};

export const neon = client;
