import { createHash, timingSafeEqual } from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { BACKSTAGE_KEY_HEADER } from '@buffetya/shared';
import type { Request } from 'express';
import type { AppConfig } from '../../config.js';
import { APP_CONFIG } from './tokens.js';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * The backstage is the team's manual "behind the scenes" (how the MVP
 * simulates the buffet staff). It is protected by a shared key sent in a
 * header; there are no user accounts in the MVP.
 */
@Injectable()
export class BackstageGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.backstageKey;
    if (!expected) {
      throw new ServiceUnavailableException('El backstage está deshabilitado: falta BACKSTAGE_KEY.');
    }
    const provided = context.switchToHttp().getRequest<Request>().header(BACKSTAGE_KEY_HEADER);
    // Compare digests so the check takes the same time whatever the input.
    if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
      throw new UnauthorizedException('Clave de backstage incorrecta.');
    }
    return true;
  }
}
