import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { UserPresenter } from '../../../users/infrastructure/http/user.presenter';


@Controller('auth')
export class AuthController {

  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
  ) { }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      const { user, accessToken } = await this.loginUserUseCase.execute(
        loginUserDto.email,
        loginUserDto.password,
      );

      return {
        user: new UserPresenter(user),
        accessToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Tentativa de login falhou para o e-mail: ${loginUserDto.email}`, error.stack);
      } else {
        this.logger.error(`Tentativa de login falhou para o e-mail: ${loginUserDto.email}`);
      }

      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}