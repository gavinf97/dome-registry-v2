import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export type UserRole = 'user' | 'admin' | 'journal_owner';

export interface JournalAssignment {
  journalId: string;
  journalName: string;
  assignedByOrcid: string;
  assignedAt: string;
}

@Schema({ collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, match: /^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$/ })
  orcid: string;

  @Prop()
  displayName?: string;

  @Prop()
  givenName?: string;

  @Prop()
  familyName?: string;

  @Prop()
  email?: string;

  @Prop()
  organisation?: string;

  @Prop({ type: [String], enum: ['user', 'admin', 'journal_owner'], default: ['user'] })
  roles: UserRole[];

  @Prop({ type: Array, default: [] })
  journalAssignments: JournalAssignment[];

  @Prop({ default: 0 })
  dailyLLMCalls: number;

  @Prop()
  dailyLLMResetAt?: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop()
  lastLoginAt?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
