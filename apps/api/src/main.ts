import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { PrismaService } from './prisma/prisma.service'; // Adjust path finding
import { Role } from '@repo/database';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('DATABASE_URL:', process.env.DATABASE_URL); // DEBUG

  // Seed Cambista
  try {
    const prismaService = app.get(PrismaService);
    const existing = await prismaService.user.findUnique({ where: { username: 'cambista1' } });
    if (!existing) {
      console.log('Seeding cambista1...');
      await prismaService.user.create({
        data: {
          username: 'cambista1',
          password: '123', // should be hashed normally but this is a quick test/dev
          role: Role.CAMBISTA,
          name: 'Cambista Teste'
        }
      });
      console.log('Seeding complete.');
    } else {
      console.log('cambista1 already exists.');
    }

    const allUsers = await prismaService.user.findMany();
    console.log('Startup Check - Total Users:', allUsers.length);
    console.log('Startup Check - Roles:', allUsers.map(u => u.role));
  } catch (e) {
    console.error('Seeding failed:', e);
  }

  console.log('🚀 API FIX APPLIED: CORS UPDATE - Origin: ALL');
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow all origins in dev or specific pattern in prod
      // For now, origin: true/true handles it, but let's be explicit if needed
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,x-client-id,x-client-version',
    exposedHeaders: 'Authorization',
  });
  // Filters
  const { HttpAdapterHost } = require('@nestjs/core');
  const { AllExceptionsFilter } = require('./all-exceptions.filter');
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API FIX APPLIED: LISTENING ON PORT ${port}`);
}
bootstrap();
