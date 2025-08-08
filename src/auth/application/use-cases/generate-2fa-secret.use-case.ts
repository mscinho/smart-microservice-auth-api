import { Injectable, Inject } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { ConfigService } from '@nestjs/config';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { UserPayloadDto } from '../dtos/user-payload.dto';

@Injectable()
export class GenerateTwoFactorAuthSecretUseCase {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(payload: UserPayloadDto): Promise<{ secret: string; otpauthUrl: string }> {
    
    const user = await this.usersRepository.findByEmail(payload.email);
    if (!user) {
      throw new Error('User not found');
    }
    
    const appName = this.configService.get<string>('APP_NAME') || 'auth-api';
    
    // 1. Gera o segredo da 2FA
    const secret = speakeasy.generateSecret({
      name: `${appName}:${user.email}`
    });
    
    // 2. Salva o segredo no usuário (operação assíncrona!)
    user.twoFactorAuthenticationSecret = secret.base32;
    const userWithSecret = await this.usersRepository.save(user);

    // 3. Cria a URL que será usada para o QR Code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${appName}:${user.email}`,
      issuer: appName,
      encoding: 'base32',
    });

    return {
      secret: userWithSecret.twoFactorAuthenticationSecret ?? '',
      otpauthUrl,
    };
  }
}