import Elysia from "elysia";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia().use(
  swagger({
    documentation: {
      info: {
        title: "Clean Architecture Backend API",
        version: "1.0.0",
        description:
          "API documentation for the Clean Architecture Backend with Drizzle ORM",
      },
      tags: [{ name: "Users", description: "User management endpoints" }],
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
    },
  })
);

export default app;
