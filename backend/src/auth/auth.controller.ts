import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('orcid')
  initiateOrcidLogin(@Res() res: Response) {
    const authUrl = this.authService.buildOrcidAuthUrl();
    res.redirect(authUrl);
  }

  @Get('orcid/callback')
  async orcidCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query['code'] as string;
    if (!code) throw new UnauthorizedException('Missing OAuth code');

    const { jwt, user } = await this.authService.handleOrcidCallback(code);

    // Redirect frontend with token in query param (frontend reads + stores it, then removes from URL)
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwt}`);
  }
}
