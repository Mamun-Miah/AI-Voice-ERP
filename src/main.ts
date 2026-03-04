import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './exceptions/prisma-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  //swagger api documentation
  const config = new DocumentBuilder()
    .setTitle('Hello Khata API Documentation')
    .setDescription('The Hello Khata API documentation')
    .setVersion('1.0')
    .addCookieAuth('Authentication')
    // .addTag('api')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  // if (process.env.NODE_ENV !== 'production') {
  //   SwaggerModule.setup('docs', app, documentFactory);
  // }
  SwaggerModule.setup('docs', app, documentFactory);

  // compression
  app.use(compression());
  // --- Security ---
  app.use(helmet());
  app.use(cookieParser());

  // --- Logging ---
  app.useLogger(app.get(Logger));

  // --- Global Filters ---
  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- Global Pipes ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- API Prefix ---
  app.setGlobalPrefix('api');

  // --- CORS ---
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
