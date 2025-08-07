import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { IRefreshTokenRepository } from '../../../auth/domain/repositories/refresh-token-repository.interface';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenEntity } from '../../../auth/infrastructure/typeorm/refresh-token.entity';
import { User } from '../../../users/domain/entities/user';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let refreshTokenRepository: IRefreshTokenRepository;
  let usersRepository: IUsersRepository;
  let jwtService: JwtService;

  const mockUser: User = { id: 1, email: 'test@email.com', isActive: true };

  const mockRefreshTokenEntity: RefreshTokenEntity = {
    id: 'old-refresh-token',
    user: mockUser as any,
    isActive: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Expira em 1 hora
    createdAt: new Date(),
  };

  const mockRefreshTokenRepository = {
    findById: jest.fn(),
    revoke: jest.fn(),
    create: jest.fn(),
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    refreshTokenRepository = module.get<IRefreshTokenRepository>('IRefreshTokenRepository');
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should refresh a token and return new tokens', async () => {
    jest.spyOn(refreshTokenRepository, 'findById').mockResolvedValue(mockRefreshTokenEntity);
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    (uuidv4 as jest.Mock).mockReturnValue('new-refresh-token');

    const result = await useCase.execute('old-refresh-token');

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('old-refresh-token');
    expect(usersRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(jwtService.sign).toHaveBeenCalledWith({ email: mockUser.email, sub: mockUser.id });
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  // --- Teste de Falha (Token não encontrado) ---
  it('should throw an error if the refresh token is not found', async () => {
    jest.spyOn(refreshTokenRepository, 'findById').mockResolvedValue(null);
    await expect(useCase.execute('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });

  // --- Teste de Falha (Token expirado - 7 dias) ---
  it('should throw an error if the refresh token is expired', async () => {
    const expiredToken = { ...mockRefreshTokenEntity, id: 'expired-token', expiresAt: new Date(Date.now() - 1) };
    jest.spyOn(refreshTokenRepository, 'findById').mockResolvedValue(expiredToken);
    await expect(useCase.execute('expired-token')).rejects.toThrow('Invalid or expired refresh token');
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('expired-token');
  });

  // --- Teste de Falha (Sessão total expirada - 30 dias) ---
  it('should throw an error if the total session has expired', async () => {
    const oldToken = { ...mockRefreshTokenEntity, id: 'old-token', createdAt: new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)) };
    jest.spyOn(refreshTokenRepository, 'findById').mockResolvedValue(oldToken);
    await expect(useCase.execute('old-token')).rejects.toThrow('Invalid or expired refresh token');
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('old-token');
  });
});