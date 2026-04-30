import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument } from '../users/user.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async listUsers(page = 1, limit = 50): Promise<{ total: number; users: UserDocument[] }> {
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.find().skip(skip).limit(limit).exec(),
    ]);
    return { total, users };
  }

  async setRoles(
    orcid: string,
    roles: string[],
    journalAssignments?: Array<{ journalId: string; journalName: string }>,
  ): Promise<UserDocument> {
    const update: Record<string, unknown> = { roles };
    if (journalAssignments !== undefined) update.journalAssignments = journalAssignments;

    const user = await this.userModel.findOneAndUpdate(
      { orcid },
      { $set: update },
      { new: true },
    );
    if (!user) throw new NotFoundException(`User ${orcid} not found`);
    return user;
  }

  async updateScoringWeights(weights: Record<string, unknown>): Promise<void> {
    const weightsPath = path.resolve(__dirname, '../../../../schema/scoring-weights.json');
    // Basic validation: must have fields as object keys at top level and each have weight/level
    const entries = Object.entries(weights);
    for (const [, val] of entries) {
      if (typeof (val as any).weight !== 'number') {
        throw new ForbiddenException('Each weight entry must have a numeric "weight" field');
      }
    }
    fs.writeFileSync(weightsPath, JSON.stringify(weights, null, 2));
  }
}
