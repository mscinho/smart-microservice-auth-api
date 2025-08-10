import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository.interface';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  async create(token: PasswordResetTokenEntity): Promise<PasswordResetTokenEntity> {
    return this.repository.save(token);
  }

  async findById(id: string): Promise<PasswordResetTokenEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['user'] });
  }

  async findActiveByUser(user: UserEntity): Promise<PasswordResetTokenEntity | null> {
    return this.repository.findOne({ where: { user: user, isActive: true } });
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }
}