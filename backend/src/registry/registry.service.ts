import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { RegistryEntry, RegistryEntryDocument } from './registry-entry.schema';
import { Version, VersionDocument } from './version.schema';
import { ScoringService } from '../scoring/scoring.service';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const SCHEMA_VERSION = '2.0.0';

@Injectable()
export class RegistryService {
  constructor(
    @InjectModel(RegistryEntry.name) private readonly entryModel: Model<RegistryEntryDocument>,
    @InjectModel(Version.name) private readonly versionModel: Model<VersionDocument>,
    private readonly scoringService: ScoringService,
  ) {}

  async create(userOrcid: string, data: Record<string, unknown>): Promise<RegistryEntryDocument> {
    const now = new Date().toISOString();
    const score = this.scoringService.computeScore(data);

    const entry = new this.entryModel({
      uuid: uuidv4(),
      shortid: nanoid(),
      user: userOrcid,
      created: now,
      updated: now,
      moderationStatus: 'draft',
      score,
      ...data,
    });

    return entry.save();
  }

  async findById(uuid: string): Promise<RegistryEntryDocument | null> {
    return this.entryModel.findOne({ uuid });
  }

  async findByShortid(shortid: string): Promise<RegistryEntryDocument | null> {
    return this.entryModel.findOne({ shortid });
  }

  async update(
    uuid: string,
    userOrcid: string,
    patch: Record<string, unknown>,
    changeNote?: string,
  ): Promise<RegistryEntryDocument | null> {
    const existing = await this.findById(uuid);
    if (!existing) return null;

    // Create immutable version snapshot before applying patch
    await new this.versionModel({
      entryId: uuid,
      schemaVersion: SCHEMA_VERSION,
      data: existing.toObject(),
      editedBy: userOrcid,
      editedAt: new Date().toISOString(),
      changeNote,
    }).save();

    const now = new Date().toISOString();
    const merged = { ...existing.toObject(), ...patch };
    const score = this.scoringService.computeScore(merged);

    return this.entryModel.findOneAndUpdate(
      { uuid },
      { $set: { ...patch, updated: now, score } },
      { new: true },
    );
  }

  async search(query: {
    text?: string;
    tags?: string[];
    minScore?: number;
    moderationStatus?: string;
    journalId?: string;
    user?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ items: RegistryEntryDocument[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (query.text) {
      filter['$text'] = { $search: query.text };
    }
    if (query.tags?.length) {
      filter['tags'] = { $in: query.tags };
    }
    if (query.minScore !== undefined) {
      filter['score'] = { $gte: query.minScore };
    }
    if (query.moderationStatus) {
      filter['moderationStatus'] = query.moderationStatus;
    } else {
      filter['moderationStatus'] = 'public';
    }
    if (query.journalId) {
      filter['journalId'] = query.journalId;
    }
    if (query.user) {
      filter['user'] = query.user;
    }

    const skip = query.skip ?? 0;
    const limit = Math.min(query.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.entryModel.find(filter).skip(skip).limit(limit).sort({ score: -1 }),
      this.entryModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async getHistory(uuid: string): Promise<VersionDocument[]> {
    return this.versionModel.find({ entryId: uuid }).sort({ editedAt: -1 });
  }
}
