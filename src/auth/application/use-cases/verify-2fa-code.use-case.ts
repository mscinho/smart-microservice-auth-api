import { Injectable, Inject } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';

@Injectable()
export class VerifyTwoFactorAuthCodeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) { }

  async execute(userId: number, code: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.twoFactorAuthenticationSecret) {
      return false;
    }

    console.log(code);

    // Verifica se o código é válido
    const isCodeValid = speakeasy.totp.verify({
      secret: user.twoFactorAuthenticationSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    // Se o código for válido, ativa o 2FA para o usuário
    if (isCodeValid) {
      user.isTwoFactorAuthenticationEnabled = true;
      await this.usersRepository.save(user);
    }

    return isCodeValid;
  }
}