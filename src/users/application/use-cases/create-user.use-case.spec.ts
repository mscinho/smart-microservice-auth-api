import { User } from '../../domain/entities/user';
import { IUsersRepository } from '../../domain/repositories/users-repository.interface';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repository: IUsersRepository;

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    useCase = new CreateUserUseCase(repository);
  });

  it('should create a user successfully', async () => {
    // Garante que findByEmail retorne null (usuário não existe)
    jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);
    // Garante que o método create retorne o usuário criado
    jest.spyOn(repository, 'create').mockResolvedValue({ 
      id: 1, 
      email: 'test@email.com', 
      password: '...', 
      isActive: true,
      isTwoFactorAuthenticationEnabled: false,
      createdAt: new Date()
    });

    const user = await useCase.execute('test@email.com', 'strong-password');
    expect(user).toBeDefined();
    expect(repository.create).toHaveBeenCalledWith(expect.any(User));
  });

  it('should throw an error if the email already exists', async () => {
    // Simula a situação onde o usuário já existe
    jest.spyOn(repository, 'findByEmail').mockResolvedValue({ 
      id: 1, 
      email: 'test@email.com', 
      password: '...', 
      isActive: true,
      isTwoFactorAuthenticationEnabled: false,
      createdAt: new Date()
    });

    await expect(useCase.execute('test@email.com', 'strong-password')).rejects.toThrow('E-mail já cadastrado');
    expect(repository.create).not.toHaveBeenCalled();
  });
});