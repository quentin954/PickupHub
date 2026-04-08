import { z } from 'zod';

export const packageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional(),
});

export type PackageQueryInput = z.infer<typeof packageQuerySchema>;

const packageStatusEnum = z.enum(['AVAILABLE_FOR_PICKUP', 'DELIVERED', 'EXPIRED', 'IN_TRANSIT']);

export const updatePackageSchema = z.object({
  status: packageStatusEnum,
});

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;