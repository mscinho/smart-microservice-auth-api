import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { USERS_REPOSITORY } from '../infrastructure/users.providers';
import { UserEntity } from '../infrastructure/typeorm/user.entity';


describe('UsersController (e2e)', () => {
  let app: INestApplication;
  const mockUsersRepository = {
    // Apenas o método que o use-case chama precisa ser mockado
    create: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null), // ou o valor que desejar retornar no teste
  };

  beforeAll(async () => {
    // 1. Cria um módulo de teste da aplicação completa
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // 2. Sobrescreve o provedor do repositório
      // Isso garante que o use-case e o controller usarão o nosso mock,
      // e não tentarão acessar o banco de dados real.
      .overrideProvider(USERS_REPOSITORY)
      .useValue(mockUsersRepository)
      .compile();

    // 3. Inicializa a aplicação de teste
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // --- O Teste de Integração ---
  it('POST /users/register should create a new user', async () => {
    // 1. Define os dados de entrada
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    // 2. Mocka a resposta do repositório
    // O mock precisa retornar uma entidade com ID, simulando a criação no banco.
    const userEntity = new UserEntity();
    userEntity.id = 1;
    userEntity.email = createUserDto.email;
    mockUsersRepository.create.mockResolvedValue(userEntity);

    // 3. Simula a requisição HTTP com o supertest
    const response = await request(app.getHttpServer() as import('http').Server)
      .post('/users/register')
      .send(createUserDto)
      .expect(201); // 4. Verifica se o status da resposta é 201 (Created)

    // 5. Verifica o corpo da resposta
    expect(response.body).toEqual({
      id: 1,
      email: createUserDto.email,
    });
    // 6. Verifica se o mock do repositório foi chamado com os dados corretos
    expect(mockUsersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: createUserDto.email,
        isActive: false,
      }),
    );
  });

  afterAll(async () => {
    // Fecha a aplicação de teste para liberar a porta e os recursos
    await app.close();
  });
});