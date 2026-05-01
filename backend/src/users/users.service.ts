import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async upsertFromOrcid(data: {
    orcid: string;
    displayName?: string;
    givenName?: string;
    familyName?: string;
    email?: string;
  }): Promise<UserDocument> {
    const now = new Date().toISOString();
    return this.userModel.findOneAndUpdate(
      { orcid: data.orcid },
      {
        $set: {
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.givenName && { givenName: data.givenName }),
          ...(data.familyName && { familyName: data.familyName }),
          ...(data.email && { email: data.email }),
          lastLoginAt: now,
        },
        $setOnInsert: {
          orcid: data.orcid,
          roles: ['user'],
          journalAssignments: [],
          dailyLLMCalls: 0,
          createdAt: now,
        },
      },
      { upsert: true, new: true },
    );
  }

  async findByOrcid(orcid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ orcid });
  }

  async incrementLLMCalls(orcid: string): Promise<void> {
    const now = new Date();
    const user = await this.findByOrcid(orcid);
    if (!user) return;

    const resetAt = user.dailyLLMResetAt ? new Date(user.dailyLLMResetAt) : null;
    const isNewDay = !resetAt || now.toDateString() !== resetAt.toDateString();

    if (isNewDay) {
      await this.userModel.updateOne(
        { orcid },
        { $set: { dailyLLMCalls: 1, dailyLLMResetAt: now.toISOString() } },
      );
    } else {
      await this.userModel.updateOne({ orcid }, { $inc: { dailyLLMCalls: 1 } });
    }
  }

  async getDailyLLMCalls(orcid: string): Promise<number> {
    const user = await this.findByOrcid(orcid);
    if (!user) return 0;
    const resetAt = user.dailyLLMResetAt ? new Date(user.dailyLLMResetAt) : null;
    const now = new Date();
    if (!resetAt || now.toDateString() !== resetAt.toDateString()) return 0;
    return user.dailyLLMCalls;
  }

  async updateProfile(orcid: string, data: { displayName?: string; organisation?: string }): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { orcid },
      { $set: data },
      { new: true },
    );
  }

  async setRoles(orcid: string, roles: UserRole[]): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { orcid },
      { $set: { roles } },
      { new: true },
    );
  }

  async listAll(): Promise<UserDocument[]> {
    return this.userModel.find();
  }

  async findAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ roles: 'admin' });
  }

  async findJournalOwnersByJournal(journalId: string): Promise<UserDocument[]> {
    return this.userModel.find({
      roles: 'journal_owner',
      'journalAssignments.journalId': journalId,
    });
  }
}
