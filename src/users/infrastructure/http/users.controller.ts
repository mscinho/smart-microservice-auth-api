import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UserPresenter } from './user.presenter';


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
    // Retornamos um DTO ou Presenter para não expor a senha criptografada.
    return new UserPresenter(user);
  }
}
