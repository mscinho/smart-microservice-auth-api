import { Controller, Post, Body, HttpException, HttpStatus, Logger, UseGuards, Request, HttpCode, Get, Res } from '@nestjs/common';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { UserPresenter } from '../../../users/infrastructure/http/user.presenter';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GenerateTwoFactorAuthSecretUseCase } from '../../application/use-cases/generate-2fa-secret.use-case';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { UserPayloadDto } from '../../application/dtos/user-payload.dto';
import type { RequestWithUser } from '../../../common/interfaces/request-with-user.interface';
import { TwoFactorAuthCodeDto } from '../../application/dtos/two-factor-auth-code.dto';
import { VerifyTwoFactorAuthCodeUseCase } from '../../application/use-cases/verify-2fa-code.use-case';
import { VerifyTwoFactorAuthCodeOnLoginUseCase } from '../../application/use-cases/verify-2fa-code-on-login.use-case';
import { User } from '../../../users/domain/entities/user';
import { TwoFactorAuthLoginDto } from '../../application/dtos/two-factor-auth-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginWithGoogleUseCase } from '../../application/use-cases/login-with-google.use-case';
import type { Response } from 'express';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ForgotPasswordDto } from '../../application/dtos/forgot-password.dto';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordDto } from '../../application/dtos/reset-password.dto';

@Controller('auth')
export class AuthController {

  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly generateTwoFactorAuthSecretUseCase: GenerateTwoFactorAuthSecretUseCase,
    private readonly verifyTwoFactorAuthCodeUseCase: VerifyTwoFactorAuthCodeUseCase,
    private readonly verify2FaCodeOnLoginUseCase: VerifyTwoFactorAuthCodeOnLoginUseCase,
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase
  ) { }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      const result = await this.loginUserUseCase.execute(
        loginUserDto.email,
        loginUserDto.password,
      );

      if ('requires2Fa' in result && result.requires2Fa) {
        return { user: { id: result.user.id, email: result.user.email }, message: '2FA required' };
      }

      const { user, accessToken, refreshToken } = result as { user: User, accessToken: string, refreshToken: string };

      return {
        user: new UserPresenter(user),
        accessToken,
        refreshToken
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const { user, accessToken, refreshToken } = await this.refreshTokenUseCase.execute(
        refreshTokenDto.refreshToken,
      );
      return {
        user: new UserPresenter(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Falha ao renovar token`, error.stack);
      if (error instanceof Error && error.message === 'Invalid or expired refresh token') {
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generateTwoFactorAuthSecret(@Request() req: RequestWithUser) {

    const userPayload: UserPayloadDto = req.user;

    const { secret, otpauthUrl } = await this.generateTwoFactorAuthSecretUseCase.execute(userPayload);

    return {
      secret,
      otpauthUrl,
    };
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard) // A rota é protegida para garantir que o usuário está logado
  async verifyTwoFactorAuthCode(
    @Request() req: RequestWithUser,
    @Body() twoFactorAuthCodeDto: TwoFactorAuthCodeDto,
  ) {
    const userPayload: UserPayloadDto = req.user;

    const isCodeValid = await this.verifyTwoFactorAuthCodeUseCase.execute(
      userPayload.id,
      twoFactorAuthCodeDto.code,
    );

    if (!isCodeValid) {
      throw new HttpException('Código de autenticação inválido', HttpStatus.FORBIDDEN);
    }

    return { message: 'Autenticação de dois fatores ativada com sucesso!' };
  }

  @Post('2fa/login')
  async loginWith2FA(@Body() twoFactorAuthLoginDto: TwoFactorAuthLoginDto) {
    try {
      const { user, accessToken, refreshToken } = await this.verify2FaCodeOnLoginUseCase.execute(
        twoFactorAuthLoginDto.userId,
        twoFactorAuthLoginDto.code,
      );
      return {
        user: new UserPresenter(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Tentativa de login 2FA falhou para o ID: ${twoFactorAuthLoginDto.userId}`, error.stack);
      if (error instanceof Error && (error.message === 'Invalid 2FA code' || error.message === '2FA not enabled for this user')) {
        throw new HttpException('Código de autenticação inválido ou 2FA não ativado', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req: { user: string }, @Res() res: Response) {
    const email = req.user;

    const { accessToken, refreshToken } = await this.loginWithGoogleUseCase.execute(email);

    // Redireciona o usuário de volta para o front-end com os tokens
    const redirectHtml = `
      <script>
        window.opener.postMessage({ accessToken: '${accessToken}', refreshToken: '${refreshToken}' }, 'http://localhost:4200');
        window.close();
      </script>
    `;

    res.send(redirectHtml);
  }

  // --- Nova Rota para Recuperação de Senha ---
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(forgotPasswordDto.email);
    return { message: 'Se o e-mail estiver cadastrado, uma instrução de recuperação será enviada.' };
  }

  // --- Nova Rota para Redefinir Senha ---
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.resetPasswordUseCase.execute(resetPasswordDto.token, resetPasswordDto.newPassword);
      return { message: 'Sua senha foi redefinida com sucesso.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      if (message === 'Token de recuperação de senha inválido ou expirado.') {
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}