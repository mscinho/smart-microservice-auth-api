import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserUseCase } from './login-user.use-case';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../users/domain/entities/user';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt'); // Mocka a biblioteca bcrypt

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let usersRepository: IUsersRepository;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'hashedPassword',
    isActive: true,
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
  };


  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  // --- Teste de Sucesso ---
  it('should return a user and an accessToken on successful login', async () => {
    // Mocka as dependências
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jest.spyOn(jwtService, 'sign').mockReturnValue('mocked.jwt.token');

    const result = await useCase.execute('test@email.com', 'plainPassword');

    // Verifica as chamadas
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', mockUser.password);
    expect(jwtService.sign).toHaveBeenCalledWith({ email: mockUser.email, sub: mockUser.id });

    // Verifica o resultado
    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe('mocked.jwt.token');
  });

  // --- Teste de Falha (Usuário não encontrado) ---
  it('should throw an error if the user is not found', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

    await expect(useCase.execute('nonexistent@email.com', 'anyPassword')).rejects.toThrow('Invalid credentials');
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('nonexistent@email.com');
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  // --- Teste de Falha (Senha incorreta) ---
  it('should throw an error if the password is not valid', async () => {
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute('test@email.com', 'wrongPassword')).rejects.toThrow('Invalid credentials');
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
  });
});