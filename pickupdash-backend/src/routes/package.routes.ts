import { Router } from 'express';
import { getPackages, synchronize, updatePackage } from '../controllers/package.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { packageQuerySchema, updatePackageSchema } from '../dto/packages.dto';

const router = Router();

router.get('/', protect, validate({ query: packageQuerySchema }), getPackages);
router.post('/synchronize', protect, synchronize);
router.patch('/:id', protect, validate({ body: updatePackageSchema }), updatePackage);

export default router;