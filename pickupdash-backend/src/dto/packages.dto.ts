import { z } from 'zod';
import { PAGINATION } from '../constants/defaults';

export const packageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  status: z.string().optional(),
});

export type PackageQueryInput = z.infer<typeof packageQuerySchema>;

const packageStatusEnum = z.enum(['AVAILABLE_FOR_PICKUP', 'DELIVERED', 'EXPIRED', 'IN_TRANSIT']);

export const updatePackageSchema = z.object({
  status: packageStatusEnum,
});

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;