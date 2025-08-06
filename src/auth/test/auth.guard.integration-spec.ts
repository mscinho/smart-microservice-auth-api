import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Get, Controller, HttpStatus, UnauthorizedException, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';

// 1. Cria um controller de teste para usar o guardião
@Controller('test-route')
class TestController {
  @Get()
  getProtectedResource() {
    return 'Protected content';
  }
}

// 2. Mocka o AuthGuard
// O mock vai simular o comportamento do guardião, permitindo ou não a rota
const mockGuard: jest.Mocked<CanActivate> = {
  canActivate: jest.fn<ReturnType<CanActivate['canActivate']>, [ExecutionContext]>(),
};

describe('JwtAuthGuard (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(mockGuard);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Teste de Sucesso ---

  it('should allow access to a protected route with a valid token', async () => {
    // 4. Mocka o canActivate para retornar true
    mockGuard.canActivate.mockReturnValue(true);

    const response = await request(app.getHttpServer() as import('http').Server).get('/test-route');
    
    // Verifica se a resposta foi bem-sucedida (status 200 OK)
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toBe('Protected content');
    // Verifica se o guardião foi chamado
    expect(mockGuard.canActivate).toHaveBeenCalled();
  });

  // --- Teste de Falha ---
  it('should deny access to a protected route with an invalid token', async () => {
    // 5. Mocka o canActivate para lançar UnauthorizedException
    mockGuard.canActivate.mockImplementation(() => { throw new UnauthorizedException(); });

    const response = await request(app.getHttpServer() as import('http').Server).get('/test-route');
    
    // Verifica se a requisição foi rejeitada com status 401 Unauthorized
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(mockGuard.canActivate).toHaveBeenCalled();
  });
});