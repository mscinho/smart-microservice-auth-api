import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Get, Controller, UseGuards, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from '../infrastructure/jwt/jwt.strategy';
import { JwtAuthGuard } from '../infrastructure/jwt/jwt-auth.guard';
import { USERS_REPOSITORY } from '../../users/infrastructure/users.providers';
import { User } from '../../users/domain/entities/user';


// 1. Cria um controller de teste para usar o guardião real
@Controller('test-protected')
class TestProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedResource() {
    return 'Protected content';
  }
}

describe('JwtAuthGuard (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

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
    findById: jest.fn(),
  };
  
  // Cria uma chave secreta de teste
  const testSecret = 'testSecretForIntegration';

  beforeAll(async () => {
    jest.clearAllMocks();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestProtectedController],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: testSecret })], // Usa um segredo de teste
        }),
        PassportModule,
        JwtModule.register({
          secret: testSecret,
          signOptions: { expiresIn: '60s' },
        }),
      ],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Obtenha o JwtService da aplicação de teste para gerar o token
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access to a protected route with a valid token', async () => {
    jest.spyOn(mockUsersRepository, 'findByEmail').mockResolvedValue(mockUser);
    
    // Gera um token real de teste usando a chave secreta
    const token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });

    const response = await request(app.getHttpServer() as import('http').Server).get('/test-protected')
      .set('Authorization', `Bearer ${token}`) // Adiciona o token no header
      .expect(HttpStatus.OK);
    
    expect(response.text).toBe('Protected content');
  });

  it('should deny access to a protected route without a token', async () => {
    const response = await request(app.getHttpServer() as import('http').Server).get('/test-protected')
      .expect(HttpStatus.UNAUTHORIZED);
    
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should deny access to a protected route with an invalid token', async () => {
    const invalidToken = 'invalid-token';
    const response = await request(app.getHttpServer() as import('http').Server).get('/test-protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
    
    expect(response.body.message).toBe('Unauthorized');
  });
});