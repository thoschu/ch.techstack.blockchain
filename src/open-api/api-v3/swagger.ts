import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API with Swagger',
      version: '1.0.0',
      description: 'Dokumentation der API-Endpunkte mit Swagger'
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v3',
        description: 'Lokaler Server',
      },
    ],
  },
  apis: [
    './src/routes/*.ts'
  ]
};

export const swaggerSpecs: object = swaggerJsdoc(options);
