import { Injectable, Inject } from '@nestjs/common';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import { JwtService } from '@nestjs/jwt';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';
import { RefreshTokenEntity } from '../../infrastructure/typeorm/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(email: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    let user = await this.usersRepository.findByEmail(email);

    if (!user) {
      const newUser = new User(email);
      user = await this.usersRepository.create(newUser);
    }
    
    // Gera os tokens de acesso e refresh
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    
    const newRefreshToken = new RefreshTokenEntity();
    newRefreshToken.id = uuidv4();
    newRefreshToken.user = { id: user.id } as any;
    newRefreshToken.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    newRefreshToken.sessionCreatedAt = new Date();
    await this.refreshTokenRepository.create(newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken.id };
  }
}