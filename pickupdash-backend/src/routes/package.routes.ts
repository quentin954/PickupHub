import { Router } from 'express';
import { getPackages, synchronize, updatePackage } from '../controllers/package.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getPackages);
router.post('/synchronize', protect, synchronize);
router.patch('/:id', protect, updatePackage);

export default router;