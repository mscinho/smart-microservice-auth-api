import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { IUsersRepository } from '../../../users/domain/repositories/users-repository.interface';
import { USERS_REPOSITORY } from '../../../users/infrastructure/users.providers';
import { User } from '../../../users/domain/entities/user';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersRepository: IUsersRepository;

  // Um usuário mock para os testes
  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    isActive: true,
  };

  // Mock do ConfigService
  const mockConfigService = {
    get: jest.fn(() => 'testSecretKey'),
  };

  // Mock do IUsersRepository
  const mockUsersRepository = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // --- Caso de Sucesso ---
  it('should validate and return the user payload', async () => {
    // Simula que o repositório encontrou um usuário
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
    
    // O payload que seria extraído do token
    const payload = { sub: mockUser.id, email: mockUser.email };
    
    // Executa o método validate
    const result = await strategy.validate(payload);
    
    // Verifica se o método findByEmail foi chamado
    expect(usersRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
    
    // Verifica se o resultado é o payload correto
    expect(result).toEqual({ id: mockUser.id, email: mockUser.email });
  });

  // --- Caso de Falha (Usuário não encontrado) ---
  it('should throw an UnauthorizedException if the user is not found', async () => {
    // Simula que o repositório não encontrou o usuário
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);
    
    const payload = { sub: 99, email: 'nonexistent@email.com' };

    // Espera que o método lance uma exceção
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  // --- Caso de Falha (Token inválido ou expirado) ---
  // A classe-mãe do Passport já lida com a validação de token e expiração.
  // Nosso teste foca na lógica interna do método 'validate'.
  // Se o token for inválido, o Passport nem sequer chamaria o método 'validate'.
  it('should throw an UnauthorizedException if the user is not active', async () => {
    // Cria um usuário inativo mockado
    const inactiveUser = { ...mockUser, isActive: false };
    
    // Simula que o repositório encontrou o usuário, mas ele está inativo
    jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(inactiveUser);
    
    const payload = { sub: inactiveUser.id, email: inactiveUser.email };

    // Espera que a estratégia lance uma exceção de não autorizado
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});