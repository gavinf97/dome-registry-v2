import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';
import { RegistryEntry, RegistryEntrySchema } from './registry-entry.schema';
import { Version, VersionSchema } from './version.schema';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistryEntry.name, schema: RegistryEntrySchema },
      { name: Version.name, schema: VersionSchema },
    ]),
    ScoringModule,
  ],
  controllers: [RegistryController],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
