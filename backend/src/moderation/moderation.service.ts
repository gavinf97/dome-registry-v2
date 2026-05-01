import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { RegistryEntry, RegistryEntryDocument } from '../registry/registry-entry.schema';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

type ModerationStatus = 'draft' | 'pending' | 'public' | 'rejected';

const VALID_TRANSITIONS: Record<ModerationStatus, ModerationStatus[]> = {
  draft: ['pending'],
  pending: ['public', 'rejected'],
  public: [],
  rejected: [],
};

export interface AdminQueueFilters {
  text?: string;
  status?: string;
  journal?: string;
  isAiGenerated?: boolean;
}

@Injectable()
export class ModerationService {
  constructor(
    @InjectModel(RegistryEntry.name) private readonly entryModel: Model<RegistryEntryDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async submit(uuid: string, userOrcid: string, journalId?: string): Promise<RegistryEntryDocument> {
    const entry = await this.entryModel.findOne({ uuid });
    if (!entry) throw new NotFoundException();
    if (entry.user !== userOrcid) throw new BadRequestException('Not the entry owner');
    if (entry.moderationStatus !== 'draft') {
      throw new BadRequestException(`Cannot submit from state: ${entry.moderationStatus}`);
    }

    const newStatus: ModerationStatus = 'pending';
    const updated = await this.entryModel.findOneAndUpdate(
      { uuid },
      { $set: { moderationStatus: newStatus, ...(journalId && { journalId }), updated: new Date().toISOString() } },
      { new: true },
    );

    // Send confirmation to submitter (look up actual email via UsersService)
    const submitter = await this.usersService.findByOrcid(userOrcid);
    if (submitter?.email) {
      await this.mailService.sendSubmissionConfirmation(submitter.email, uuid).catch(() => undefined);
    }

    // Notify admins and, if journal submission, journal owners
    const admins = await this.usersService.findAdmins();
    const adminEmails = admins.map(u => u.email).filter((e): e is string => Boolean(e));

    let journalOwnerEmails: string[] = [];
    if (journalId) {
      const owners = await this.usersService.findJournalOwnersByJournal(journalId);
      journalOwnerEmails = owners.map(u => u.email).filter((e): e is string => Boolean(e));
    }

    const recipients = [...new Set([...adminEmails, ...journalOwnerEmails])];
    if (recipients.length > 0) {
      await this.mailService
        .sendAdminNotification(
          recipients,
          submitter?.displayName ?? userOrcid,
          uuid,
          (updated?.publication?.['title'] as string) ?? uuid,
          journalId,
        )
        .catch(() => undefined);
    }

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

    const updated = await this.entryModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          moderationStatus: status,
          public: status === 'public',
          ...(journalId && { journalId }),
          ...(status === 'rejected' && { rejectedAt: new Date() }),
          updated: new Date().toISOString(),
        },
      },
      { new: true },
    );

    // Notify entry owner of status change
    if (updated) {
      const owner = await this.usersService.findByOrcid(updated.user);
      if (owner?.email) {
        await this.mailService
          .sendStatusChanged(owner.email, uuid, status, updated.publication?.['title'] as string)
          .catch(() => undefined);
      }
    }

    return updated as RegistryEntryDocument;
  }

  async notifySubmitter(uuid: string, message: string): Promise<void> {
    const entry = await this.entryModel.findOne({ uuid });
    if (!entry) throw new NotFoundException();

    const owner = await this.usersService.findByOrcid(entry.user);
    if (!owner?.email) return;

    const title = (entry.publication?.['title'] as string) ?? uuid;
    await this.mailService.sendNotificationToSubmitter(owner.email, uuid, title, message);
  }

  async getAdminQueue(
    userOrcid: string,
    userRoles: string[],
    journalAssignments: Array<{ journalId: string }>,
    filters: AdminQueueFilters = {},
  ): Promise<RegistryEntryDocument[]> {
    const nonPublicStatuses: ModerationStatus[] = ['draft', 'pending', 'rejected'];
    const query: FilterQuery<RegistryEntryDocument> = {};

    // Scope by status filter or default to all non-public
    if (filters.status && nonPublicStatuses.includes(filters.status as ModerationStatus)) {
      query.moderationStatus = filters.status;
    } else {
      query.moderationStatus = { $in: nonPublicStatuses };
    }

    // Journal owners only see their assigned journals
    if (!userRoles.includes('admin')) {
      const journalIds = journalAssignments.map(j => j.journalId);
      query.journalId = { $in: journalIds };
    }

    if (filters.journal) {
      query.journalId = filters.journal;
    }

    if (filters.isAiGenerated !== undefined) {
      query.isAiGenerated = filters.isAiGenerated;
    }

    if (filters.text) {
      const escaped = filters.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'publication.title': { $regex: escaped, $options: 'i' } },
        { user: { $regex: escaped, $options: 'i' } },
      ];
    }

    return this.entryModel.find(query).sort({ updated: -1 }).limit(200);
  }

  async getJournalQueue(journalId: string): Promise<RegistryEntryDocument[]> {
    return this.entryModel.find({ journalId, moderationStatus: 'pending' });
  }
}
