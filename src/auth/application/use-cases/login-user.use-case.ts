import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(email: string, password_plain: string): Promise<{ user: User; accessToken: string }> {
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

    return { user, accessToken };
  }
}