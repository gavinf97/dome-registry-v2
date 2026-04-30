import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegistryEntry, RegistryEntryDocument } from '../registry/registry-entry.schema';
import { MailService } from '../mail/mail.service';

type ModerationStatus = 'draft' | 'pending' | 'public' | 'held' | 'rejected';

const VALID_TRANSITIONS: Record<ModerationStatus, ModerationStatus[]> = {
  draft: ['pending'],
  pending: ['public', 'held', 'rejected'],
  held: ['public', 'rejected'],
  public: ['held'],
  rejected: [],
};

@Injectable()
export class ModerationService {
  constructor(
    @InjectModel(RegistryEntry.name) private readonly entryModel: Model<RegistryEntryDocument>,
    private readonly mailService: MailService,
  ) {}

  async submit(uuid: string, userOrcid: string, journalId?: string): Promise<RegistryEntryDocument> {
    const entry = await this.entryModel.findOne({ uuid });
    if (!entry) throw new NotFoundException();
    if (entry.user !== userOrcid) throw new BadRequestException('Not the entry owner');
    if (entry.moderationStatus !== 'draft') {
      throw new BadRequestException(`Cannot submit from state: ${entry.moderationStatus}`);
    }

    const newStatus: ModerationStatus = journalId ? 'held' : 'pending';
    const updated = await this.entryModel.findOneAndUpdate(
      { uuid },
      { $set: { moderationStatus: newStatus, ...(journalId && { journalId }), updated: new Date().toISOString() } },
      { new: true },
    );

    await this.mailService.sendSubmissionConfirmation(userOrcid, uuid);
    return updated!;
  }

  async setStatus(uuid: string, status: ModerationStatus, journalId?: string): Promise<RegistryEntryDocument> {
    const entry = await this.entryModel.findOne({ uuid });
    if (!entry) throw new NotFoundException();

    const allowed = VALID_TRANSITIONS[entry.moderationStatus as ModerationStatus] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid transition: ${entry.moderationStatus} → ${status}`,
      );
    }

    return this.entryModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          moderationStatus: status,
          public: status === 'public',
          ...(journalId && { journalId }),
          updated: new Date().toISOString(),
        },
      },
      { new: true },
    ) as Promise<RegistryEntryDocument>;
  }

  async getJournalQueue(journalId: string): Promise<RegistryEntryDocument[]> {
    return this.entryModel.find({ journalId, moderationStatus: 'held' });
  }
}
