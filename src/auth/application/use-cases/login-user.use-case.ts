import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import * as bcrypt from 'bcrypt';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenEntity } from '../../infrastructure/typeorm/refresh-token.entity';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(email: string, password_plain: string): Promise<{ user: User; accessToken: string, refreshToken: string }> {
    // 1. Busca o usuário pelo e-mail
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // 2. Compara a senha
    const isPasswordValid = await bcrypt.compare(password_plain, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Gera o token JWT
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    // 4. Gera e persiste o refreshToken (de longa duração)
    const newRefreshToken = new RefreshTokenEntity();
    newRefreshToken.id = uuidv4();
    newRefreshToken.user = { id: user.id } as any;
    newRefreshToken.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // Expira em 7 dias

    await this.refreshTokenRepository.create(newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken.id };
  }
}