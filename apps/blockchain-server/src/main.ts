import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

(async () => {
  const globalPrefix = 'blockchain';
  const defaultPort = 4444;
  const port = process.env.PORT || defaultPort;
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
})();
