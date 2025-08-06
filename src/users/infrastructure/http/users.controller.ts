import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UserPresenter } from './user.presenter';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';


@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.createUserUseCase.execute(
      createUserDto.email,
      createUserDto.password,
    );
    return new UserPresenter(user);
  }

  @UseGuards(JwtAuthGuard) // 1. Usa o guardião para proteger a rota
  @Get('profile')
  getProfile(@Request() req) { // 2. Usa o decorador @Request para acessar o objeto de requisição
    // O objeto de usuário é injetado no 'req.user' pelo JwtStrategy
    return req.user;
  }

}
