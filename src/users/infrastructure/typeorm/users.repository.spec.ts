import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRepository } from './users.repository';
import { UserEntity } from './user.entity';
import { User } from '../../domain/entities/user';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let typeOrmRepository: Repository<UserEntity>;

  // Mock do repositório do TypeORM
  const mockTypeOrmRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    usersRepository = module.get<UsersRepository>(UsersRepository);
    typeOrmRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(usersRepository).toBeDefined();
  });

  // Teste para o método findByEmail
  it('should find a user by email', async () => {
    const userEntity = new UserEntity();
    userEntity.email = 'test@email.com';

    // Mocka o método findOne do TypeORM para retornar uma entidade
    jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(userEntity);

    const result = await usersRepository.findByEmail('test@email.com');
    
    // A verificação de tipo para o compilador
    if (!result) {
      // Se for nulo, falha o teste explicitamente.
      // Isso é útil para casos onde o mock não funciona como esperado.
      fail('User should not be null in this success test.');
    }

    // Verifica se o método findOne do TypeORM foi chamado
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@email.com' } });
    // Verifica se a entidade de domínio foi retornada
    expect(result.email).toBe('test@email.com');
  });

  // Teste para o método create
  it('should create and return a new user', async () => {
    // 1. Dados de entrada para o nosso usersRepository.create (entidade de domínio sem ID)
    const newUserDomain = new User('new@email.com');
    newUserDomain.password = 'password123'; // Senha já criptografada pelo use-case
    newUserDomain.isActive = false; // Valor padrão

    // 2. Entidade que o TypeORM.create retornaria (ainda sem ID)
    const entityWithoutId = new UserEntity();
    entityWithoutId.email = newUserDomain.email;
    entityWithoutId.password = newUserDomain.password;
    entityWithoutId.isActive = newUserDomain.isActive;

    // 3. Entidade que o TypeORM.save retornaria (agora com ID)
    const entityWithId = new UserEntity();
    entityWithId.id = 1;
    entityWithId.email = entityWithoutId.email;
    entityWithId.password = entityWithoutId.password;
    entityWithId.isActive = entityWithoutId.isActive;

    // Mocka o método create do TypeORM para retornar a entidade em memória
    mockTypeOrmRepository.create.mockReturnValue(entityWithoutId);
    // Mocka o método save do TypeORM para retornar a entidade com o ID
    mockTypeOrmRepository.save.mockResolvedValue(entityWithId);

    // Executa o método create do nosso repositório
    const result = await usersRepository.create(newUserDomain);

    // O método create do TypeORM não é chamado, pois o repositório usa UserEntity.fromDomain
    // Verifica se o método save do TypeORM foi chamado com os dados corretos
    expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: newUserDomain.email,
        password: newUserDomain.password,
        isActive: newUserDomain.isActive,
      })
    );
    // Verifica se o resultado é uma entidade de domínio com o ID
    expect(result.id).toBe(1);
    expect(result.email).toBe(newUserDomain.email);
    expect(result.isActive).toBe(false);
  });
});