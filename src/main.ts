import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app: INestApplication<any> = await NestFactory.create(AppModule);
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        imgSrc: [`'self'`, 'data:', 'localhost'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        manifestSrc: [`'self'`, 'localhost'],
        frameSrc: [`'self'`, 'localhost'],
        defaultSrc: [`'self'`, 'localhost'],
        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
      },
    },
  }));
  await app.listen(3000);
}
bootstrap();
