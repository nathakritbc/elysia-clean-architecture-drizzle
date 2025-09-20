import 'dotenv/config';
import { appConfig } from './app-config';

const url = `${appConfig.server.host}:${appConfig.server.port}`;

export const createSwaggerConfig = () => ({
  documentation: {
    info: {
      title: 'Elysia Clean Architecture Backend API',
      version: '1.0.0',
      description: 'API documentation for the Clean Architecture Backend with Drizzle ORM',
    },
    tags: [{ name: 'Users', description: 'User management endpoints' }],
    servers: [
      {
        url,
        description: 'Development server',
      },
    ],
  },
});
