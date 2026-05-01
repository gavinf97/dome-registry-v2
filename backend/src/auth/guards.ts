import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** Optional JWT: populates req.user when a valid token is present but does NOT
 *  reject unauthenticated requests. Use on public endpoints that also need to
 *  identify the caller for access-control decisions (e.g. viewing draft entries). */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}

export class RolesGuard {
  constructor(private readonly allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.roles) return false;
    return this.allowedRoles.some((role) => user.roles.includes(role));
  }
}
