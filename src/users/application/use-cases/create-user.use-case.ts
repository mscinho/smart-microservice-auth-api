import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import type { IUsersRepository } from '../../domain/repositories/users-repository.interface';
import bcrypt from 'bcrypt';
import { USERS_REPOSITORY } from '../../infrastructure/users.providers';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository
  ) {}

  async execute(email: string, password_plain: string): Promise<User> {
    const userAlreadyExists = await this.usersRepository.findByEmail(email);
    if (userAlreadyExists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    // 1. Cria a entidade de domínio
    const user = new User(email);

    // 2. Aplica a regra de negócio: criptografar a senha
    const hashedPassword = await bcrypt.hash(password_plain, 10);
    user.password = hashedPassword;

    // 3. Persiste no banco usando o repositório
    const createdUser = await this.usersRepository.create(user);
    return createdUser;
  }
}
