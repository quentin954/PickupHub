import { Router } from 'express';
import { linkPlatform, unlinkPlatform } from '../controllers/platform.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { linkPlatformSchema } from '../dto/platform.dto';

const router = Router();

router.post('/', protect, validate({ body: linkPlatformSchema }), linkPlatform);
router.delete('/', protect, unlinkPlatform);

export default router;