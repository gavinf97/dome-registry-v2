import {
  Controller, Post, Req, Res, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException, HttpException, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards';
import { CopilotService } from './copilot.service';
import { UsersService } from '../users/users.service';

const DAILY_QUOTA = Number(process.env.LLM_DAILY_QUOTA ?? 5);

@Controller('copilot')
export class CopilotController {
  constructor(
    private readonly copilotService: CopilotService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('process')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: memoryStorage(), // Never touches disk
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files are accepted'), false);
        }
        cb(null, true);
      },
    }),
  )
  async process(
    @Req() req: any,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No PDF file provided');

    const orcid: string = req.user.orcid;

    // Check daily LLM quota
    const isDev = process.env.NODE_ENV === 'development';
    const calls = await this.usersService.getDailyLLMCalls(orcid);
    if (!isDev && calls >= DAILY_QUOTA) {
      throw new HttpException(
        `Daily Copilot quota of ${DAILY_QUOTA} calls reached. Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let parsedSections: string[] | undefined;
    if (typeof req.body?.sections === 'string') {
      parsedSections = req.body.sections.split(',').map((s: string) => s.trim());
    } else if (Array.isArray(req.body?.sections)) {
      parsedSections = req.body.sections;
    }

    // Forward to copilot microservice and get stream
    const stream = await this.copilotService.process({
      pdfBuffer: file.buffer,
      doi: req.body?.doi,
      sections: parsedSections,
    });

    // Increment quota only on success
    await this.usersService.incrementLLMCalls(orcid);

    // PDF buffer is now eligible for GC — no reference kept
    res.setHeader('Content-Type', 'application/x-ndjson');
    stream.pipe(res);
  }
}
