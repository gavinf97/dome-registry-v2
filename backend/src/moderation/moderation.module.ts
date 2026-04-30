import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { RegistryEntry, RegistryEntrySchema } from '../registry/registry-entry.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RegistryEntry.name, schema: RegistryEntrySchema }]),
    UsersModule,
    MailModule,
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
