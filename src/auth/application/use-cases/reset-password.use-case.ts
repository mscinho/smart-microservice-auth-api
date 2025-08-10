import { Inject, Injectable } from '@nestjs/common';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject('IPasswordResetTokenRepository')
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
  ) {}

  async execute(token: string, newPasswordPlain: string): Promise<boolean> {
    // 1. Busca o token no banco de dados e verifica a validade
    const resetToken = await this.passwordResetTokenRepository.findById(token);

    if (!resetToken || !resetToken.isActive || resetToken.expiresAt < new Date()) {
      // Por segurança, sempre revoga o token se ele existir, mesmo que inválido.
      if (resetToken) {
        await this.passwordResetTokenRepository.revoke(resetToken.id);
      }
      throw new Error('Token de recuperação de senha inválido ou expirado.');
    }

    // 2. Revoga o token para evitar reuso
    await this.passwordResetTokenRepository.revoke(resetToken.id);

    // 3. Encontra o usuário e atualiza a senha
    const user = await this.usersRepository.findById(resetToken.user.id);

    if (!user) {
        throw new Error('Usuário não encontrado.');
    }
    
    // 4. Criptografa a nova senha e salva no usuário
    const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return true;
  }
}