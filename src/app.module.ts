import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/infrastructure/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost', // ou o IP do seu servidor MySQL
      port: 3306,
      username: 'sistema', // Seu usuário do MySQL
      password: '123456', // Sua senha do MySQL
      database: 'smart_auth_api', // O nome do seu banco de dados
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Apenas para desenvolvimento! Cuidado em produção.
    }),
    UsersModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
