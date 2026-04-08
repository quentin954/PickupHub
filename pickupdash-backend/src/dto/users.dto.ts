import { z } from 'zod';

export const profileSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('Invalid ID format'),
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>['params'];