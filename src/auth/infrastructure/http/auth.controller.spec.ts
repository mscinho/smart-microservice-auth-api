import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { User } from '../../../users/domain/entities/user';
import { UserPresenter } from '../../../users/infrastructure/http/user.presenter';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';


describe('AuthController', () => {
  let controller: AuthController;
  // Mock do LoginUserUseCase
  const mockLoginUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(jest.fn());
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUserUseCase,
          useValue: mockLoginUserUseCase,
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
    const loggedInUser: User = {
      id: 1,
      email: 'test@email.com',
      isActive: true,
    };
    
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
});