import app from './app';
import { PORT, NODE_ENV } from './config/config';
import { log } from './utils/logger';

app.listen(PORT, () => {
  log('info', `Server is running on port ${PORT}`, { environment: NODE_ENV });
});
