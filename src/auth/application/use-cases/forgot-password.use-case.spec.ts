import { Test, TestingModule } from '@nestjs/testing';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository.interface';
import { EmailService } from '../../../shared/email.service';
import { User } from '../../../users/domain/entities/user';
import { v4 as uuidv4 } from 'uuid';
import { PasswordResetTokenEntity } from '../../infrastructure/typeorm/password-reset-token.entity';

jest.mock('uuid');

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let usersRepository: IUsersRepository;
  let passwordResetTokenRepository: IPasswordResetTokenRepository;
  let emailService: EmailService;

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
  };

  const mockPasswordResetTokenRepository = {
    findActiveByUser: jest.fn(),
    revoke: jest.fn(),
    create: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create a testing module with the necessary providers
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForgotPasswordUseCase,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
        { provide: 'IPasswordResetTokenRepository', useValue: mockPasswordResetTokenRepository },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get<ForgotPasswordUseCase>(ForgotPasswordUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    passwordResetTokenRepository = module.get<IPasswordResetTokenRepository>('IPasswordResetTokenRepository');
    emailService = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should create a reset token and send an email if the user exists', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(passwordResetTokenRepository, 'findActiveByUser').mockResolvedValue(null);
    jest.spyOn(passwordResetTokenRepository, 'create').mockResolvedValue({ id: 'mock-token-id' } as PasswordResetTokenEntity);
    jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);
    (uuidv4 as jest.Mock).mockReturnValue('mock-token-id');

    const result = await useCase.execute('test@email.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
    expect(passwordResetTokenRepository.findActiveByUser).toHaveBeenCalled();
    expect(passwordResetTokenRepository.create).toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(mockUser, 'mock-token-id');
    expect(result).toBe(true);
  });
  
  // --- Teste de Falha (Usuário não encontrado) ---
  it('should return true but not send an email if the user does not exist', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

    const result = await useCase.execute('nonexistent@email.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('nonexistent@email.com');
    expect(passwordResetTokenRepository.findActiveByUser).not.toHaveBeenCalled();
    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});