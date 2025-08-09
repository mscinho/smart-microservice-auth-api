import { Test, TestingModule } from '@nestjs/testing';
import { VerifyTwoFactorAuthCodeOnLoginUseCase } from './verify-2fa-code-on-login.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { JwtService } from '@nestjs/jwt';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';
import { User } from '../../../users/domain/entities/user';
import * as speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';

jest.mock('speakeasy');
jest.mock('uuid');

describe('VerifyTwoFactorAuthCodeOnLoginUseCase', () => {
  let useCase: VerifyTwoFactorAuthCodeOnLoginUseCase;
  let usersRepository: IUsersRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'hashedPassword',
    isActive: true,
    isTwoFactorAuthenticationEnabled: true,
    twoFactorAuthenticationSecret: 'secret',
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    findById: jest.fn(),
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
        VerifyTwoFactorAuthCodeOnLoginUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
        { provide: 'IRefreshTokenRepository', useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    useCase = module.get<VerifyTwoFactorAuthCodeOnLoginUseCase>(VerifyTwoFactorAuthCodeOnLoginUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    refreshTokenRepository = module.get<IRefreshTokenRepository>('IRefreshTokenRepository');
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should return tokens on successful 2FA code verification', async () => {
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    (uuidv4 as jest.Mock).mockReturnValue('new-refresh-token');

    const result = await useCase.execute(mockUser.id, '123456');

    expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
    expect(speakeasy.totp.verify).toHaveBeenCalledWith(expect.objectContaining({ token: '123456' }));
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBeDefined();
  });

  // --- Teste de Falha (Código inválido) ---
  it('should throw an error if the 2FA code is invalid', async () => {
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    await expect(useCase.execute(mockUser.id, 'wrong-code')).rejects.toThrow('Invalid 2FA code');
    expect(speakeasy.totp.verify).toHaveBeenCalled();
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  // --- Teste de Falha (2FA não habilitada) ---
  it('should throw an error if 2FA is not enabled for the user', async () => {
    const userWithout2FA = { ...mockUser, isTwoFactorAuthenticationEnabled: false };
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(userWithout2FA);

    await expect(useCase.execute(mockUser.id, '123456')).rejects.toThrow('2FA not enabled for this user');
    expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
  });
  
  // --- Teste de Falha (Usuário não encontrado) ---
  it('should throw an error if the user is not found', async () => {
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute(mockUser.id, '123456')).rejects.toThrow('2FA not enabled for this user');
    expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
  });
});