import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/typeorm/user.entity';
import { UsersController } from './infrastructure/http/users.controller';
import { UsersRepository } from './infrastructure/typeorm/users.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USERS_REPOSITORY } from './infrastructure/users.providers';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
  exports: [
    CreateUserUseCase,
    USERS_REPOSITORY,
  ],
})
export class UsersModule {}