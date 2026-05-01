import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RegistryEntryDocument = HydratedDocument<RegistryEntry>;

export type ModerationStatus = 'draft' | 'pending' | 'public' | 'rejected';

@Schema({ collection: 'registry' })
export class RegistryEntry {
  @Prop({ required: true, unique: true })
  uuid: string;

  @Prop({ required: true, unique: true })
  shortid: string;

  @Prop({ required: true, match: /^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$/ })
  user: string;

  @Prop({ default: false })
  public: boolean;

  @Prop({ default: false })
  isAiGenerated: boolean;

  @Prop({ required: true })
  created: string;

  @Prop({ required: true })
  updated: string;

  @Prop({
    required: true,
    enum: ['draft', 'pending', 'public', 'rejected'],
    default: 'draft',
  })
  moderationStatus: ModerationStatus;

  @Prop()
  journalId?: string;

  @Prop({ type: Date, index: { expireAfterSeconds: 2592000 } }) // 30 days
  rejectedAt?: Date;

  @Prop({ default: 0, min: 0, max: 100 })
  score: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  publication?: Record<string, unknown>;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop({ type: Object })
  optimization?: Record<string, unknown>;

  @Prop({ type: Object })
  model?: Record<string, unknown>;

  @Prop({ type: Object })
  evaluation?: Record<string, unknown>;
}

export const RegistryEntrySchema = SchemaFactory.createForClass(RegistryEntry);

// Text index for search
RegistryEntrySchema.index({ 'publication.title': 'text', tags: 'text' });
