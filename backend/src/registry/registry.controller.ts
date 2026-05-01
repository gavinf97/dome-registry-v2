import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
  ForbiddenException, NotFoundException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { RegistryService } from './registry.service';
import { IsOptional, IsString, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class SearchQueryDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) minScore?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) skip?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() isAiGenerated?: boolean;
  @IsOptional() @IsString() year?: string;
  @IsOptional() @IsString() journal?: string;
}

class UpdateEntryDto {
  @IsOptional() data?: Record<string, unknown>;
  @IsOptional() @IsString() changeNote?: string;
}

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: Record<string, unknown>) {
    return this.registryService.create(req.user.orcid, body);
  }

  @Get()
  async search(@Query() query: SearchQueryDto) {
    return this.registryService.search({
      ...query,
      sortBy: query.sortBy,
      isAiGenerated: query.isAiGenerated,
    });
  }

  @Get('stats')
  async getStats() {
    return this.registryService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMyEntries(@Req() req: any) {
    return this.registryService.findByUser(req.user.orcid);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/pending')
  async getPendingQueue(@Req() req: any) {
    if (!req.user.roles?.includes('admin')) throw new ForbiddenException();
    return this.registryService.getPendingQueue();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string, @Req() req: any) {
    const entry = (await this.registryService.findById(id)) ?? (await this.registryService.findByShortid(id));
    if (!entry) throw new NotFoundException();
    const isOwner = entry.user === req.user.orcid;
    const isAdmin = req.user.roles?.includes('admin');
    if (!isOwner && !isAdmin) throw new ForbiddenException();
    await this.registryService.delete(entry.uuid, req.user.orcid, isAdmin);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: any) {
    const entry = (await this.registryService.findById(id)) ?? (await this.registryService.findByShortid(id));
    if (!entry) throw new NotFoundException();

    // Non-public entries: only accessible by owner or admin
    if (entry.moderationStatus !== 'public') {
      const user = req.user;
      if (!user) throw new NotFoundException();
      if (entry.user !== user.orcid && !user.roles?.includes('admin')) {
        throw new ForbiddenException();
      }
    }
    return entry;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateEntryDto,
  ) {
    const entry = (await this.registryService.findById(id)) ?? (await this.registryService.findByShortid(id));
    if (!entry) throw new NotFoundException();

    const isOwner = entry.user === req.user.orcid;
    const isAdmin = req.user.roles?.includes('admin');
    if (!isOwner && !isAdmin) throw new ForbiddenException();

    return this.registryService.update(entry.uuid, req.user.orcid, dto.data ?? {}, dto.changeNote);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getHistory(@Param('id') id: string, @Req() req: any) {
    const entry = (await this.registryService.findById(id)) ?? (await this.registryService.findByShortid(id));
    if (!entry) throw new NotFoundException();

    const isOwner = entry.user === req.user.orcid;
    const isAdmin = req.user.roles?.includes('admin');
    if (entry.moderationStatus !== 'public' && !isOwner && !isAdmin) {
      throw new ForbiddenException();
    }
    return this.registryService.getHistory(entry.uuid);
  }
}
