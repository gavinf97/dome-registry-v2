import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RegistryModule } from './registry/registry.module';
import { CopilotModule } from './copilot/copilot.module';
import { ModerationModule } from './moderation/moderation.module';
import { ScoringModule } from './scoring/scoring.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_SECONDS ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    AuthModule,
    UsersModule,
    RegistryModule,
    CopilotModule,
    ModerationModule,
    ScoringModule,
    MailModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
