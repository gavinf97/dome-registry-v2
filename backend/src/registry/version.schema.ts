import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VersionDocument = HydratedDocument<Version>;

@Schema({ collection: 'versions' })
export class Version {
  @Prop({ required: true, index: true })
  entryId: string;

  @Prop({ required: true })
  schemaVersion: string;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;

  @Prop({ required: true, match: /^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$/ })
  editedBy: string;

  @Prop({ required: true })
  editedAt: string;

  @Prop()
  changeNote?: string;
}

export const VersionSchema = SchemaFactory.createForClass(Version);
