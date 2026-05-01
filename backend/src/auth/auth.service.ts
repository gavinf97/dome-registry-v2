import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly orcidBaseUrl = process.env.ORCID_BASE_URL ?? 'https://orcid.org';
  private readonly orcidPubUrl = process.env.ORCID_PUB_URL ?? 'https://pub.orcid.org';

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  buildOrcidAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID!,
      response_type: 'code',
      scope: '/authenticate /read-limited',
      redirect_uri: process.env.ORCID_REDIRECT_URI!,
    });
    return `${this.orcidBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  async handleOrcidCallback(code: string): Promise<{ jwt: string; user: any }> {
    // Exchange code for ORCID token
    const tokenRes = await axios.post(
      `${this.orcidBaseUrl}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID!,
        client_secret: process.env.ORCID_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.ORCID_REDIRECT_URI!,
      }),
      { headers: { Accept: 'application/json' } },
    );

    const { orcid, name: displayName, access_token: accessToken } = tokenRes.data;

    if (!orcid) throw new UnauthorizedException('Could not retrieve ORCID iD');

    // Fetch full ORCID profile to get given/family name and optional email
    const profileRes = await axios.get(
      `${this.orcidPubUrl}/v3.0/${orcid}/personal-details`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    ).catch(() => null);

    const givenName = profileRes?.data?.name?.['given-names']?.value ?? undefined;
    const familyName = profileRes?.data?.name?.['family-name']?.value ?? undefined;

    const user = await this.usersService.upsertFromOrcid({
      orcid,
      displayName: displayName ?? (givenName && familyName ? `${givenName} ${familyName}` : orcid),
      givenName,
      familyName,
    });

    const payload = {
      sub: orcid,
      orcid,
      displayName: user.displayName,
      roles: user.roles,
      journalAssignments: user.journalAssignments ?? [],
    };

    const jwt = this.jwtService.sign(payload);
    return { jwt, user };
  }

  async devLogin(): Promise<{ jwt: string }> {
    const user = await this.usersService.upsertFromOrcid({
      orcid: '0000-0000-0000-0001',
      displayName: 'Dev Admin',
      givenName: 'Dev',
      familyName: 'Admin',
    });
    // Always ensure the dev user has admin role
    if (!user.roles.includes('admin')) {
      await this.usersService.setRoles(user.orcid, [...user.roles, 'admin']);
    }
    const freshUser = await this.usersService.findByOrcid(user.orcid);
    const jwt = this.jwtService.sign({
      sub: freshUser!.orcid,
      orcid: freshUser!.orcid,
      displayName: freshUser!.displayName,
      roles: freshUser!.roles,
      journalAssignments: freshUser!.journalAssignments ?? [],
    });
    return { jwt };
  }
}
