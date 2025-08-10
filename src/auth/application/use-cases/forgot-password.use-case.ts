import { Inject, Injectable } from '@nestjs/common';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository.interface';
import { PasswordResetTokenEntity } from '../../infrastructure/typeorm/password-reset-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';
import { EmailService } from '../../../shared/email.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject('IPasswordResetTokenRepository')
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(email: string): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      // Por segurança, não informamos que o usuário não existe.
      // Retornamos true para evitar que um atacante saiba quais e-mails estão cadastrados.
      return true;
    }

    // Revoga qualquer token de recuperação de senha ativo para este usuário
    const activeToken = await this.passwordResetTokenRepository.findActiveByUser(user);
    if (activeToken) {
        await this.passwordResetTokenRepository.revoke(activeToken.id);
    }

    // Cria um novo token de recuperação de senha
    const token = new PasswordResetTokenEntity();
    token.id = uuidv4();
    token.user = user as UserEntity;
    token.expiresAt = new Date(Date.now() + 1000 * 60 * 60); // Expira em 1 hora

    await this.passwordResetTokenRepository.create(token);

    await this.emailService.sendPasswordResetEmail(user, token.id);

    return true;
  }
}