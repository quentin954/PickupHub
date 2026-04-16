import { z } from 'zod';

export const linkEmailImapSchema = z.object({
  provider: z.enum(['outlook', 'hotmail', 'yahoo']),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required.'),
});

export type LinkEmailImapInput = z.infer<typeof linkEmailImapSchema>;
export type OauthCallbackInput = z.infer<typeof oauthCallbackSchema>;