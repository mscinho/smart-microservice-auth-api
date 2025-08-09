import { Test, TestingModule } from '@nestjs/testing';
import { GenerateTwoFactorAuthSecretUseCase } from './generate-2fa-secret.use-case';
import { ConfigService } from '@nestjs/config';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import * as speakeasy from 'speakeasy';

jest.mock('speakeasy');

describe('GenerateTwoFactorAuthSecretUseCase', () => {
  let useCase: GenerateTwoFactorAuthSecretUseCase;
  let usersRepository: IUsersRepository;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'hashedPassword',
    isActive: true,
    isTwoFactorAuthenticationEnabled: false,
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(() => 'test-app'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTwoFactorAuthSecretUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<GenerateTwoFactorAuthSecretUseCase>(GenerateTwoFactorAuthSecretUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should generate and save a 2FA secret and return the otpauthUrl', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

    const secret = { ascii: 'ascii-secret', base32: 'base32-secret' };
    (speakeasy.generateSecret as jest.Mock).mockReturnValue(secret);
    (speakeasy.otpauthURL as jest.Mock).mockReturnValue('otpauth://mocked-url');

    const result = await useCase.execute({ id: 1, email: 'test@email.com' });

    // Verifica se o repositório foi chamado para salvar o segredo
    expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ twoFactorAuthenticationSecret: 'base32-secret' }));
    // Verifica se a URL foi gerada
    expect(result.otpauthUrl).toBe('otpauth://mocked-url');
    // Verifica se o segredo foi retornado
    expect(result.secret).toBe('base32-secret');
  });

  // --- Teste de Falha (Usuário não encontrado) ---
  it('should throw an error if the user is not found', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

    await expect(useCase.execute({ id: 99, email: 'nonexistent@email.com' })).rejects.toThrow('User not found');
    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});