import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { ErrorMapper } from '../../core/shared/errors/errorMapper';

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Elysia Clean Architecture Backend API',
          version: '1.0.0',
          description: 'API documentation for the Clean Architecture Backend with Drizzle ORM',
        },
        tags: [{ name: 'Users', description: 'User management endpoints' }],
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
      },
    })
  )
  .onError(({ error, code }) => {
    // Handle validation errors with custom messages
    if (code === 'VALIDATION') {
      return Response.json(
        {
          error: 'VALIDATION_ERROR',
          message: error.message,
        },
        {
          status: 400,
        }
      );
    }

    // Handle all other errors using ErrorMapper
    return ErrorMapper.handleError(error);
  });

export default app;
