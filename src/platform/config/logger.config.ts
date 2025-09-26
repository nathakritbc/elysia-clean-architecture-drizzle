import 'dotenv/config';

export interface LoggingConfig {
  level: string;
  transport?: {
    target: string;
    options: {
      colorize: boolean;
    };
  };
}

export const logLevel = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const loggerTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
  },
};
