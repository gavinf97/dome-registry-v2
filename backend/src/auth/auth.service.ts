import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly orcidBaseUrl = 'https://orcid.org';

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
      `https://pub.orcid.org/v3.0/${orcid}/personal-details`,
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
    };

    const jwt = this.jwtService.sign(payload);
    return { jwt, user };
  }
}
