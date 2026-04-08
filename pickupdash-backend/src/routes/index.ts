import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import packageRoutes from './package.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/packages', packageRoutes);

export default router;
