import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import packageRoutes from './package.routes';
import platformRoutes from './platform.routes';
import emailRoutes from './email.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/packages', packageRoutes);
router.use('/platform', platformRoutes);
router.use('/emails', emailRoutes);

export default router;
