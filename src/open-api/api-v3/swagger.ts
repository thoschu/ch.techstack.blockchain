import { env } from 'process';
import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express-Blockchain API with Swagger',
      version: '3.0.0',
      description: 'Dokumentation der API-Endpunkte mit Swagger',
    },
    servers: [
      {
        url: `http://localhost:${parseInt(env.PORT!, 10) ?? 3000}/api/v3`,
        description: 'Blockchain Server by Tom S.',
      }
    ],
  },
  apis: [
    './src/routes/*.ts'
  ]
};

export const swaggerSpecs: object = swaggerJsdoc(options);
