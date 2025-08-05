import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './typeorm/user.entity';
import { UsersController } from './http/users.controller';
import { UsersRepository } from './typeorm/users.repository';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { USERS_REPOSITORY } from './users.providers';


@Module({
  imports: [
    // Importa o módulo do TypeORM e registra a entidade UserEntity
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UsersController],
  providers: [
    // Define o use-case como um provider
    CreateUserUseCase,
    // Cria um alias para a interface do repositório
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
  exports: [
    // Exporta o IUsersRepository e o CreateUserUseCase para outros módulos
    CreateUserUseCase,
    USERS_REPOSITORY,
  ],
})
export class UsersModule {}