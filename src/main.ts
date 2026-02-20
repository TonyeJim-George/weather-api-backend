import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true, 
  }));

  app.useGlobalInterceptors(
  new ClassSerializerInterceptor(app.get(Reflector)),
);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Weather API')
    .setDescription('Comprehensive API documentation for Weather for Customers platform')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }, 'JWT')
    .addTag('Authentication', 'Authentication & Authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Customers', 'Customer profile endpoints')
    .addTag('Weather', 'Weather API endpoints')
    .addTag('OTP', 'One-Time Password endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
