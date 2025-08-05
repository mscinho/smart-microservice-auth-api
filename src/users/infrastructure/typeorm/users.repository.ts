import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user';
import { IUsersRepository } from '../../domain/repositories/users-repository.interface';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.repository.findOne({ where: { email } });
    return userEntity ? userEntity.toDomain() : null;
  }

  async create(user: User): Promise<User> {
    const userEntity = UserEntity.fromDomain(user);
    const created = await this.repository.save(userEntity);
    return created.toDomain();
  }

  async save(user: User): Promise<User> {
    const userEntity = UserEntity.fromDomain(user);
    const saved = await this.repository.save(userEntity);
    return saved.toDomain();
  }
}
