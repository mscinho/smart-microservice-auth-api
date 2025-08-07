import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>,
  ) {}

  async create(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    return this.repository.save(token);
  }

  async findById(id: string): Promise<RefreshTokenEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['user'] });
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }
}