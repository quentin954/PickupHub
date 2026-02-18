import express from 'express';
import mainRouter from './routes';
import { errorHandler } from './middleware';

const app = express();

// Middleware
app.use(express.json());

// Main router
app.use('/api', mainRouter);

// Error handling
app.use(errorHandler);

export default app;
