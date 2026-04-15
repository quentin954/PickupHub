import { z } from 'zod';

export const linkPlatformSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required.'),
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export type LinkPlatformInput = z.infer<typeof linkPlatformSchema>;