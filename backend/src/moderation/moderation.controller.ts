import {
  Controller, Patch, Post, Param, Body, Req, UseGuards,
  ForbiddenException, Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { ModerationService } from './moderation.service';
import { IsString, IsEnum, IsOptional } from 'class-validator';

type ModerationStatus = 'draft' | 'pending' | 'public' | 'held' | 'rejected';

class ModerateDto {
  @IsEnum(['draft', 'pending', 'public', 'held', 'rejected'])
  status: ModerationStatus;

  @IsOptional() @IsString() journalId?: string;
}

class SubmitDto {
  @IsOptional() @IsString() journalId?: string;
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
