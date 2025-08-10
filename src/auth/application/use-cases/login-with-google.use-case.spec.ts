// src/auth/application/use-cases/login-with-google.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LoginWithGoogleUseCase } from './login-with-google.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import { JwtService } from '@nestjs/jwt';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('LoginWithGoogleUseCase', () => {
  let useCase: LoginWithGoogleUseCase;
  let usersRepository: IUsersRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: undefined,
    isActive: true,
    isTwoFactorAuthenticationEnabled: false,
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginWithGoogleUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
        { provide: 'IRefreshTokenRepository', useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    useCase = module.get<LoginWithGoogleUseCase>(LoginWithGoogleUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    refreshTokenRepository = module.get<IRefreshTokenRepository>('IRefreshTokenRepository');
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso (Usuário Existente) ---
  it('should find an existing user and return tokens', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(jwtService, 'sign').mockReturnValue('mock-access-token');
    (uuidv4 as jest.Mock).mockReturnValue('mock-refresh-token');

    const result = await useCase.execute('test@email.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });

  // --- Teste de Sucesso (Novo Usuário) ---
  it('should create a new user and return tokens', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(usersRepository, 'create').mockResolvedValue(mockUser);
    jest.spyOn(jwtService, 'sign').mockReturnValue('mock-access-token');
    (uuidv4 as jest.Mock).mockReturnValue('mock-refresh-token');

    const result = await useCase.execute('newuser@email.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('newuser@email.com');
    expect(usersRepository.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });

  // --- Teste de Falha (Erro de Persistência) ---
  it('should throw an error if the refresh token cannot be created', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(refreshTokenRepository, 'create').mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute('test@email.com')).rejects.toThrow('DB error');
  });
});