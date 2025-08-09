import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, Logger } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../auth.module';
import { USERS_REPOSITORY } from '../../users/infrastructure/users.providers';
import { User } from '../../users/domain/entities/user';
import { RefreshTokenEntity } from '../infrastructure/typeorm/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../../users/users.module';
import { RefreshTokenRepository } from '../infrastructure/typeorm/refresh-token.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../users/infrastructure/typeorm/user.entity';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
jest.mock('uuid');

describe('AuthModule (Refresh Token Integration)', () => {
  let app: INestApplication;

  const mockUser: User = {
    id: 1,
    email: 'test@email.com',
    password: 'hashedPassword',
    isActive: true,
    isTwoFactorAuthenticationEnabled: false,
    createdAt: new Date(),
  };

  const mockRefreshTokenEntity: RefreshTokenEntity = {
    id: 'test-refresh-token',
    isActive: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 dias
    createdAt: new Date(),
    sessionCreatedAt: new Date(),
    user: mockUser as any,
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findById: jest.fn(),
    revoke: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(async () => {
    jest.clearAllMocks();

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        UsersModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        JwtModule.register({
            secret: 'test-secret',
            signOptions: { expiresIn: '60s' }
        })
      ],
    })
      .overrideProvider(USERS_REPOSITORY)
      .useValue(mockUsersRepository)
      .overrideProvider('IRefreshTokenRepository')
      .useValue(mockRefreshTokenRepository)
      .overrideProvider(RefreshTokenRepository)
      .useValue(mockRefreshTokenRepository)
      .overrideProvider(getRepositoryToken(RefreshTokenEntity))
      .useValue({})
      .overrideProvider(DataSource)
      .useValue({})
      .overrideProvider(getRepositoryToken(UserEntity))
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/refresh should return new tokens with a valid refresh token', async () => {
    (uuidv4 as jest.Mock).mockReturnValue('new-refresh-token');
    mockRefreshTokenRepository.findById.mockResolvedValue(mockRefreshTokenEntity);
    mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
    mockRefreshTokenRepository.create.mockResolvedValue({
        ...mockRefreshTokenEntity,
        id: 'new-refresh-token',
    });

    const response = await request(app.getHttpServer() as import('http').Server)
      .post('/auth/refresh')
      .send({ refreshToken: 'test-refresh-token' })
      .expect(HttpStatus.OK);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBe('new-refresh-token');
    expect(response.body.user.email).toBe(mockUser.email);
    expect(mockRefreshTokenRepository.revoke).toHaveBeenCalledWith('test-refresh-token');
  });

  it('POST /auth/refresh should return 401 Unauthorized for an invalid refresh token', async () => {
    mockRefreshTokenRepository.revoke.mockClear();
    mockRefreshTokenRepository.findById.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer() as import('http').Server)
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.message).toBe('Invalid or expired token');
    expect(mockRefreshTokenRepository.revoke).not.toHaveBeenCalled();
  });
});