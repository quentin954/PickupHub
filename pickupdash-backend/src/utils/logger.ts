import { NODE_ENV } from '../config/config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export const log = (level: LogLevel, message: string, meta?: object) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (NODE_ENV === 'development') {
        console.debug(JSON.stringify(logEntry));
      }
      break;
  }
};
