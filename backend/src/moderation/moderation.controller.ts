import {
  Controller, Patch, Post, Param, Body, Req, UseGuards,
  ForbiddenException, Get, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { ModerationService, AdminQueueFilters } from './moderation.service';
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

type ModerationStatus = 'draft' | 'pending' | 'public' | 'rejected';

class ModerateDto {
  @IsEnum(['draft', 'pending', 'public', 'rejected'])
  status: ModerationStatus;

  @IsOptional() @IsString() journalId?: string;
}

class SubmitDto {
  @IsOptional() @IsString() journalId?: string;
}

class AdminQueueQueryDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() journal?: string;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() isAiGenerated?: boolean;
}

class NotifyDto {
  @IsString() message: string;
}

@Controller('registry')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':uuid/submit')
  async submit(@Param('uuid') uuid: string, @Req() req: any, @Body() dto: SubmitDto) {
    return this.moderationService.submit(uuid, req.user.orcid, dto.journalId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:uuid/moderate')
  async moderate(@Param('uuid') uuid: string, @Req() req: any, @Body() dto: ModerateDto) {
    if (!req.user.roles?.includes('admin')) throw new ForbiddenException();
    return this.moderationService.setStatus(uuid, dto.status, dto.journalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/queue')
  async adminQueue(@Req() req: any, @Query() query: AdminQueueQueryDto) {
    const isAdmin = req.user.roles?.includes('admin');
    const isJournalOwner = req.user.roles?.includes('journal_owner');
    if (!isAdmin && !isJournalOwner) throw new ForbiddenException();

    const filters: AdminQueueFilters = {
      text: query.text,
      status: query.status,
      journal: query.journal,
      isAiGenerated: query.isAiGenerated,
    };

    return this.moderationService.getAdminQueue(
      req.user.orcid,
      req.user.roles,
      req.user.journalAssignments ?? [],
      filters,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/:uuid/notify')
  async notifySubmitter(@Param('uuid') uuid: string, @Req() req: any, @Body() dto: NotifyDto) {
    if (!req.user.roles?.includes('admin')) throw new ForbiddenException();
    await this.moderationService.notifySubmitter(uuid, dto.message);
    return { sent: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('journals/:journalId/queue')
  async journalQueue(@Param('journalId') journalId: string, @Req() req: any) {
    const isAdmin = req.user.roles?.includes('admin');
    const isJournalOwner =
      req.user.roles?.includes('journal_owner') &&
      req.user.journalAssignments?.some((j: any) => j.journalId === journalId);

    if (!isAdmin && !isJournalOwner) throw new ForbiddenException();
    return this.moderationService.getJournalQueue(journalId);
  }
}

