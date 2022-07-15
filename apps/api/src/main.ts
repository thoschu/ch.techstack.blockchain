import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

// import { environment } from './environments/environment';

(async () => {
  const globalPrefix = 'api';
  const defaultPort = 3333;
  const port = process.env.PORT || defaultPort;

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
})();
