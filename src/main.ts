import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global Config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Validation Pipe
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

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LevelUpCode API')
    .setDescription(
      'API Backend de la plateforme LevelUpCode (Leçons, Quiz, Gamification, Administration & Signalement).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT (Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'État de santé et informations système')
    .addTag('Auth', 'Authentification locale et OAuth2 (Google, GitHub)')
    .addTag('Categories', 'Gestion et consultation des 9 catégories pédagogiques')
    .addTag('Lessons', 'Catalogue des leçons, markdown et validation de progression')
    .addTag('Quizzes', 'QCM interactifs, soumission des réponses et explications')
    .addTag('Gamification', 'Streaks, points XP, durées et classements')
    .addTag('Reports', "Signalement d'erreurs et alertes automatiques à l'administrateur")
    .addTag('Donations', 'Soutien Buy Me a Coffee et statut Supporter')
    .addTag('Admin - Lessons', 'CRUD administratif complet des leçons')
    .addTag('Admin - Quizzes', 'CRUD administratif complet des quiz et questions')
    .addTag('Notifications', 'Rappels quotidiens Cloud Scheduler')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'LevelUpCode API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 Serveur démarré avec succès sur : http://localhost:${port}`);
  logger.log(`📚 Documentation Swagger accessible sur : http://localhost:${port}/api/docs`);
}

await bootstrap();
