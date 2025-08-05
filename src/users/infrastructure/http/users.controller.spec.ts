import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UserPresenter } from './user.presenter';
import { User } from '../../domain/entities/user';

describe('UsersController', () => {
  let controller: UsersController;
  
  // Um mock simples para o nosso use-case
  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    // Cria um módulo de teste do NestJS para o nosso controller
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        // Fornece o mock do use-case no lugar da implementação real
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Caso de Sucesso ---
  it('should register a user and return a presenter', async () => {
    // 1. Dados de entrada que o controller receberia
    const dto: CreateUserDto = {
      email: 'test@email.com',
      password: 'password123',
    };

    // 2. Mocka a resposta do use-case
    // O use-case 'mockado' retornará uma entidade User
    const createdUser: User = { id: 1, email: dto.email, isActive: true };
    mockCreateUserUseCase.execute.mockResolvedValue(createdUser);

    // 3. Executa o método do controller
    const result = await controller.register(dto);

    // 4. Faz as verificações
    // Verifica se o use-case foi chamado com os dados corretos
    expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(dto.email, dto.password);
    // Verifica se a resposta do controller é uma instância de UserPresenter
    expect(result).toBeInstanceOf(UserPresenter);
    // Verifica se os dados do presenter estão corretos
    expect(result.email).toBe(dto.email);
  });

  // --- Caso de Erro ---
  it('should throw an error if the use-case throws an exception', async () => {
    // 1. Dados de entrada
    const dto: CreateUserDto = {
      email: 'existing@email.com',
      password: 'password123',
    };

    // 2. Mocka a resposta do use-case para lançar um erro
    mockCreateUserUseCase.execute.mockRejectedValue(new Error('User already exists'));

    // 3. Faz a verificação
    // Espera que o controller lance um erro
    await expect(controller.register(dto)).rejects.toThrow('User already exists');
    // Verifica se o use-case foi chamado, mas não houve retorno de sucesso
    expect(mockCreateUserUseCase.execute).toHaveBeenCalled();
  });
});