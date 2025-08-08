import { Injectable, Inject } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { JwtService } from '@nestjs/jwt';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenEntity } from '../../infrastructure/typeorm/refresh-token.entity';
import { User } from '../../../users/domain/entities/user';

@Injectable()
export class VerifyTwoFactorAuthCodeOnLoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) { }

  async execute(userId: number, code: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.isTwoFactorAuthenticationEnabled || !user.twoFactorAuthenticationSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // Verifica se o código é válido
    const isCodeValid = speakeasy.totp.verify({
      secret: user.twoFactorAuthenticationSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isCodeValid) {
      throw new Error('Invalid 2FA code');
    }

    // Se o código for válido, emite os tokens
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const now = new Date();

    const newRefreshToken = new RefreshTokenEntity();
    newRefreshToken.id = uuidv4();
    newRefreshToken.user = { id: user.id } as any;
    newRefreshToken.expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
    newRefreshToken.sessionCreatedAt = now;

    await this.refreshTokenRepository.create(newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken.id };
  }
}