import {
  Controller, Get, Patch, Param, Body, Req, UseGuards, ForbiddenException, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { AdminService } from './admin.service';
import { IsArray, IsString, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class JournalAssignmentDto {
  @IsString() journalId: string;
  @IsString() journalName: string;
}

class SetRolesDto {
  @IsArray()
  @IsEnum(['user', 'admin', 'journal_owner', 'curator'], { each: true })
  roles: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JournalAssignmentDto)
  journalAssignments?: JournalAssignmentDto[];
}

function requireAdmin(req: any) {
  if (!req.user?.roles?.includes('admin')) throw new ForbiddenException();
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Req() req: any, @Query('page') page = '1', @Query('limit') limit = '50', @Query('q') q = '') {
    requireAdmin(req);
    return this.adminService.listUsers(Number(page), Number(limit), q);
  }

  @Patch('users/:orcid/roles')
  async setRoles(@Param('orcid') orcid: string, @Body() dto: SetRolesDto, @Req() req: any) {
    requireAdmin(req);
    return this.adminService.setRoles(orcid, dto.roles, dto.journalAssignments);
  }

  @Patch('scoring-weights')
  async updateScoringWeights(@Body() weights: Record<string, unknown>, @Req() req: any) {
    requireAdmin(req);
    await this.adminService.updateScoringWeights(weights);
    return { ok: true };
  }
}
