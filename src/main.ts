import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet, { HelmetOptions } from 'helmet';

import { AppModule } from './app.module';

(async (): Promise<void> => {
  const app: INestApplication<any> = await NestFactory.create(AppModule);
  const helmetOptions: HelmetOptions = {
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    originAgentCluster: true,
    referrerPolicy: true,
    contentSecurityPolicy: {
      directives: {
        imgSrc: [`'self'`, 'data:', 'localhost', 'https://www.thomas-schulte.de/images/made_with_love.gif'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        manifestSrc: [`'self'`, 'localhost'],
        frameSrc: [`'self'`, 'localhost'],
        defaultSrc: [`'self'`, 'localhost'],
        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
      },
    },
  };

  app.use(helmet(helmetOptions));

  await app.listen(3000);
})();
