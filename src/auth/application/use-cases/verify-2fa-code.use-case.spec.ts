import { Test, TestingModule } from '@nestjs/testing';
import { VerifyTwoFactorAuthCodeUseCase } from './verify-2fa-code.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';
import * as speakeasy from 'speakeasy';

jest.mock('speakeasy');

describe('VerifyTwoFactorAuthCodeUseCase', () => {
  let useCase: VerifyTwoFactorAuthCodeUseCase;
  let usersRepository: IUsersRepository;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'hashedPassword',
    isActive: true,
    isTwoFactorAuthenticationEnabled: false, // 2FA desativada inicialmente
    twoFactorAuthenticationSecret: 'test-secret',
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyTwoFactorAuthCodeUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
      ],
    }).compile();

    useCase = module.get<VerifyTwoFactorAuthCodeUseCase>(VerifyTwoFactorAuthCodeUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should successfully verify the code and enable 2FA', async () => {

    jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);
    
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    jest.spyOn(usersRepository, 'save').mockResolvedValue({
      ...mockUser,
      isTwoFactorAuthenticationEnabled: true,
    });

    const result = await useCase.execute(mockUser.id, '123456');

    expect(result).toBe(true);
    // Verifica se o método save do repositório foi chamado para atualizar o status
    expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isTwoFactorAuthenticationEnabled: true }));
  });

  // --- Teste de Falha (Código inválido) ---
  it('should not enable 2FA if the code is invalid', async () => {
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);
    
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    const result = await useCase.execute(mockUser.id, 'wrong-code');

    expect(result).toBe(false);
    // Garante que o método save não foi chamado
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  // --- Teste de Falha (Usuário não encontrado ou sem segredo) ---
  it('should return false if the user is not found or has no secret', async () => {

    jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

    const result = await useCase.execute(mockUser.id, '123456');

    expect(result).toBe(false);
    // Garante que a verificação de código não foi executada
    expect(speakeasy.totp.verify).not.toHaveBeenCalled();
  });
});