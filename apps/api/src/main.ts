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

  app.enableCors({
    origin: ['https://pos-jogos-plataforma-web.uawtgc.easypanel.host', 'http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  await app.listen(3333, '0.0.0.0');
}
bootstrap();
