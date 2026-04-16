import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getGoogleAuthUrl, handleGoogleCallback, linkEmailWithImap, unlinkEmail } from '../controllers/email.controller';
import { linkEmailImapSchema, oauthCallbackSchema } from '../dto/email.dto';

const router = Router();

router.get('/oauth/authorize', protect, getGoogleAuthUrl);
router.post('/oauth/callback', protect, validate({ body: oauthCallbackSchema }), handleGoogleCallback);
router.post('/', protect, validate({ body: linkEmailImapSchema }), linkEmailWithImap);
router.delete('/', protect, unlinkEmail);

export default router;