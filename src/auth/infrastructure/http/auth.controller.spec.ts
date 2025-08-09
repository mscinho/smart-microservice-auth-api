import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { User } from '../../../users/domain/entities/user';
import { UserPresenter } from '../../../users/infrastructure/http/user.presenter';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { VerifyTwoFactorAuthCodeOnLoginUseCase } from '../../application/use-cases/verify-2fa-code-on-login.use-case';
import { GenerateTwoFactorAuthSecretUseCase } from '../../application/use-cases/generate-2fa-secret.use-case';
import { VerifyTwoFactorAuthCodeUseCase } from '../../application/use-cases/verify-2fa-code.use-case';
import { TwoFactorAuthLoginDto } from '../../application/dtos/two-factor-auth-login.dto';
import { RequestWithUser } from '../../../common/interfaces/request-with-user.interface';


describe('AuthController', () => {
  let controller: AuthController;

  const mockLoginUserUseCase = { execute: jest.fn() };
  const mockRefreshTokenUseCase = { execute: jest.fn() };
  const mockGenerate2faSecretUseCase = { execute: jest.fn() };
  const mockVerify2FaCodeUseCase = { execute: jest.fn() };
  const mockVerify2FaCodeOnLoginUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(jest.fn());

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUserUseCase,
          useValue: mockLoginUserUseCase,
        },
        {
          provide: RefreshTokenUseCase,
          useValue: mockRefreshTokenUseCase,
        },
        {
          provide: GenerateTwoFactorAuthSecretUseCase,
          useValue: mockGenerate2faSecretUseCase,
        },
        {
          provide: VerifyTwoFactorAuthCodeUseCase,
          useValue: mockVerify2FaCodeUseCase,
        },
        {
          provide: VerifyTwoFactorAuthCodeOnLoginUseCase,
          useValue: mockVerify2FaCodeOnLoginUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should login a user and return an accessToken and a UserPresenter', async () => {
    // Dados de entrada
    const loginUserDto: LoginUserDto = {
      email: 'test@email.com',
      password: 'password123',
    };

    // Entidade de domínio que o use-case retornaria
    const loggedInUser = new User('test@email.com');
    loggedInUser.id = 1;
    loggedInUser.isActive = true;

    // Mocka a resposta do use-case
    mockLoginUserUseCase.execute.mockResolvedValue({
      user: loggedInUser,
      accessToken: 'mocked.jwt.token',
    });

    const result = await controller.login(loginUserDto);

    // Verifica se o use-case foi chamado
    expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
      loginUserDto.email,
      loginUserDto.password,
    );

    // Verifica a resposta do controller
    expect(result.accessToken).toBe('mocked.jwt.token');
    expect(result.user).toBeInstanceOf(UserPresenter);
    expect(result.user.email).toBe(loggedInUser.email);
  });

  // --- Teste de Falha (Credenciais Inválidas) ---
  it('should throw UnauthorizedException on invalid credentials', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'wrong@email.com',
      password: 'wrongpassword',
    };

    // Mocka o use-case para lançar um erro de credenciais inválidas
    mockLoginUserUseCase.execute.mockRejectedValue(new Error('Invalid credentials'));

    await expect(controller.login(loginUserDto)).rejects.toThrow(
      new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED),
    );
    expect(mockLoginUserUseCase.execute).toHaveBeenCalled();
  });

  // --- Teste de Falha (Outros Erros) ---
  it('should throw InternalServerError for other errors', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'any@email.com',
      password: 'anypassword',
    };

    // Mocka o use-case para lançar um erro inesperado
    mockLoginUserUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

    await expect(controller.login(loginUserDto)).rejects.toThrow(
      new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
    );
    expect(mockLoginUserUseCase.execute).toHaveBeenCalled();
  });

  it('should refresh tokens and return new tokens on success', async () => {

    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    const newTokens = {
      user: { id: 1, email: 'test@email.com' },
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    // Mocka a resposta do use-case
    mockRefreshTokenUseCase.execute.mockResolvedValue(newTokens);

    const result = await controller.refresh(refreshTokenDto);

    // Verifica se o use-case foi chamado
    expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith(refreshTokenDto.refreshToken);

    // Verifica a resposta do controller
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('should throw UnauthorizedException for an invalid refresh token', async () => {
    const refreshTokenDto = { refreshToken: 'invalid-token' };

    // Mocka o use-case para lançar um erro de token inválido
    mockRefreshTokenUseCase.execute.mockRejectedValue(new Error('Invalid or expired refresh token'));

    await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
      new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED),
    );
    expect(mockRefreshTokenUseCase.execute).toHaveBeenCalled();
  });

  it('should throw InternalServerError for other unexpected errors', async () => {
    const refreshTokenDto = { refreshToken: 'any-token' };

    // Mocka o use-case para lançar um erro inesperado
    mockRefreshTokenUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

    await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
      new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
    );
    expect(mockRefreshTokenUseCase.execute).toHaveBeenCalled();
  });

  // --- Novos Testes para a rota /auth/2fa/generate ---
  it('should generate a 2FA secret and return the otpauthUrl', async () => {

    const userPayload = { id: 1, email: 'test@email.com' };
    const secretResult = {
      secret: 'mock-secret',
      otpauthUrl: 'otpauth://totp/mocked-url',
    };

    mockGenerate2faSecretUseCase.execute.mockResolvedValue(secretResult);

    const req = { user: userPayload } as RequestWithUser;
    const result = await controller.generateTwoFactorAuthSecret(req);

    expect(mockGenerate2faSecretUseCase.execute).toHaveBeenCalledWith(userPayload);
    expect(result).toEqual(secretResult);
  });

  it('should throw an error if the user is not found during secret generation', async () => {
    const userPayload = { id: 99, email: 'nonexistent@email.com' };
    mockGenerate2faSecretUseCase.execute.mockRejectedValue(new Error('User not found'));

    const req = { user: userPayload } as RequestWithUser;
    await expect(controller.generateTwoFactorAuthSecret(req)).rejects.toThrow(Error('User not found'));
  });

  // --- Novos Testes para a rota /auth/2fa/verify ---
  it('should successfully verify the 2FA code and enable 2FA', async () => {
    const userPayload = { id: 1, email: 'test@email.com' };
    const codeDto = { code: '123456' };

    mockVerify2FaCodeUseCase.execute.mockResolvedValue(true);
    const req = { user: userPayload } as RequestWithUser;

    const result = await controller.verifyTwoFactorAuthCode(req, codeDto);

    expect(mockVerify2FaCodeUseCase.execute).toHaveBeenCalledWith(userPayload.id, codeDto.code);
    expect(result).toEqual({ message: 'Autenticação de dois fatores ativada com sucesso!' });
  });

  it('should throw ForbiddenException if the 2FA code is invalid', async () => {
    const userPayload = { id: 1, email: 'test@email.com' };
    const codeDto = { code: 'wrong-code' };

    mockVerify2FaCodeUseCase.execute.mockResolvedValue(false);
    const req = { user: userPayload } as RequestWithUser;

    await expect(controller.verifyTwoFactorAuthCode(req, codeDto)).rejects.toThrow(
      new HttpException('Código de autenticação inválido', HttpStatus.FORBIDDEN),
    );
    expect(mockVerify2FaCodeUseCase.execute).toHaveBeenCalled();
  });

  // --- Novos Testes para a rota /auth/2fa/login ---
  it('should return tokens on a successful 2FA login', async () => {
    const login2faDto: TwoFactorAuthLoginDto = { userId: 1, code: '123456' };
    const loggedInUser = new User('test@email.com');
    loggedInUser.id = 1;
    loggedInUser.isActive = true;
    const tokens = {
      user: loggedInUser,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    mockVerify2FaCodeOnLoginUseCase.execute.mockResolvedValue(tokens);

    const result = await controller.loginWith2FA(login2faDto);

    expect(mockVerify2FaCodeOnLoginUseCase.execute).toHaveBeenCalledWith(
      login2faDto.userId,
      login2faDto.code,
    );
    expect(result.accessToken).toBe(tokens.accessToken);
    expect(result.refreshToken).toBe(tokens.refreshToken);
    expect(result.user).toBeInstanceOf(UserPresenter);
    expect(result.user.email).toBe(loggedInUser.email);
  });

  it('should throw UnauthorizedException for an invalid 2FA code', async () => {
    const login2faDto: TwoFactorAuthLoginDto = { userId: 1, code: 'wrong-code' };
    mockVerify2FaCodeOnLoginUseCase.execute.mockRejectedValue(new Error('Invalid 2FA code'));

    await expect(controller.loginWith2FA(login2faDto)).rejects.toThrow(
      new HttpException('Código de autenticação inválido ou 2FA não ativado', HttpStatus.UNAUTHORIZED),
    );
    expect(mockVerify2FaCodeOnLoginUseCase.execute).toHaveBeenCalled();
  });

  it('should throw InternalServerError for other unexpected errors', async () => {
    const login2faDto: TwoFactorAuthLoginDto = { userId: 1, code: 'any-token' };
    mockVerify2FaCodeOnLoginUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

    await expect(controller.loginWith2FA(login2faDto)).rejects.toThrow(
      new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
    );
    expect(mockVerify2FaCodeOnLoginUseCase.execute).toHaveBeenCalled();
  });

});