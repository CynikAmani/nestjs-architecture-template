import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CONFIG_KEYS, EnvironmentVariables } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables>);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = configService.getOrThrow(CONFIG_KEYS.PORT, { infer: true });
  await app.listen(port);
}
bootstrap();
