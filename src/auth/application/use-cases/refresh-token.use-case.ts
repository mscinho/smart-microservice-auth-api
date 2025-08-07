// src/auth/application/use-cases/refresh-token.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IRefreshTokenRepository } from '../../../auth/domain/repositories/refresh-token-repository.interface';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenEntity } from '../../../auth/infrastructure/typeorm/refresh-token.entity';
import { User } from '../../../users/domain/entities/user';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // 1. Busca o token de refresh no banco de dados
    const storedToken = await this.refreshTokenRepository.findById(refreshToken);

    // Define a duração máxima da sessão em dias
    const maxSessionDurationInDays = 30;
    const maxSessionDuration = maxSessionDurationInDays * 24 * 60 * 60 * 1000;

    if (
      !storedToken || 
      !storedToken.isActive || 
      storedToken.expiresAt < new Date() ||
      (Date.now() - storedToken.createdAt.getTime()) > maxSessionDuration
    ) {
      if (storedToken) {
        await this.refreshTokenRepository.revoke(storedToken.id);
      }
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Revoga o token de refresh antigo
    await this.refreshTokenRepository.revoke(storedToken.id);

    // 3. Busca o usuário e gera novos tokens
    const user = await this.usersRepository.findByEmail(storedToken.user.email);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const payload = { email: user.email, sub: user.id };
    const newAccessToken = this.jwtService.sign(payload);

    const newRefreshTokenEntity = new RefreshTokenEntity();
    newRefreshTokenEntity.id = uuidv4();
    newRefreshTokenEntity.user = user as any;
    newRefreshTokenEntity.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.refreshTokenRepository.create(newRefreshTokenEntity);

    return { user, accessToken: newAccessToken, refreshToken: newRefreshTokenEntity.id };
  }
}