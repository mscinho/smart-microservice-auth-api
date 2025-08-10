import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository.interface';
import { User } from '../../../users/domain/entities/user';
import { PasswordResetTokenEntity } from '../../infrastructure/typeorm/password-reset-token.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let usersRepository: IUsersRepository;
  let passwordResetTokenRepository: IPasswordResetTokenRepository;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'old-hashed-password',
    isActive: true,
    isTwoFactorAuthenticationEnabled: false,
    createdAt: new Date(),
  };

  const mockPasswordResetToken: PasswordResetTokenEntity = {
    id: 'valid-token',
    user: mockUser as any,
    isActive: true,
    expiresAt: new Date(Date.now() + 100000), // Válido por mais 100 segundos
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {
    findById: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
        { provide: 'IPasswordResetTokenRepository', useValue: mockPasswordResetTokenRepository },
      ],
    }).compile();

    useCase = module.get<ResetPasswordUseCase>(ResetPasswordUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    passwordResetTokenRepository = module.get<IPasswordResetTokenRepository>('IPasswordResetTokenRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should reset password successfully with a valid token', async () => {
    jest.spyOn(passwordResetTokenRepository, 'findById').mockResolvedValue(mockPasswordResetToken);
    jest.spyOn(passwordResetTokenRepository, 'revoke').mockResolvedValue(undefined);
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

    const result = await useCase.execute('valid-token', 'new-password');
    
    expect(passwordResetTokenRepository.findById).toHaveBeenCalledWith('valid-token');
    expect(passwordResetTokenRepository.revoke).toHaveBeenCalledWith('valid-token');
    expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
    expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'new-hashed-password' }));
    expect(result).toBe(true);
  });

  // --- Teste de Falha (Token inválido ou expirado) ---
  it('should throw an error if the token is invalid or expired', async () => {
    jest.spyOn(passwordResetTokenRepository, 'findById').mockResolvedValue(null);
    jest.spyOn(passwordResetTokenRepository, 'revoke').mockResolvedValue(undefined);

    await expect(useCase.execute('invalid-token', 'new-password')).rejects.toThrow('Token de recuperação de senha inválido ou expirado.');
    expect(passwordResetTokenRepository.revoke).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  // --- Teste de Falha (Usuário não encontrado) ---
  it('should throw an error if the user associated with the token is not found', async () => {
    jest.spyOn(passwordResetTokenRepository, 'findById').mockResolvedValue(mockPasswordResetToken);
    jest.spyOn(passwordResetTokenRepository, 'revoke').mockResolvedValue(undefined);
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute('valid-token', 'new-password')).rejects.toThrow('Usuário não encontrado.');
    expect(passwordResetTokenRepository.revoke).toHaveBeenCalledWith('valid-token');
    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});