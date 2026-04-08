import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mainRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: true,
}));

app.use(apiRateLimiter);

app.use(express.json({ limit: '10kb' }));

app.use('/api', mainRouter);

app.use(errorHandler);

export default app;