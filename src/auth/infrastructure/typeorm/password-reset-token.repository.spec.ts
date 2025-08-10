// src/auth/infrastructure/typeorm/password-reset-token.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

describe('PasswordResetTokenRepository', () => {
  let repository: PasswordResetTokenRepository;
  let typeOrmRepository: Repository<PasswordResetTokenEntity>;

  const mockUserEntity: UserEntity = {
    id: 1,
    email: 'test@email.com',
  } as any;

  const mockPasswordResetTokenEntity: PasswordResetTokenEntity = {
    id: '1234-5678',
    isActive: true,
    expiresAt: new Date(Date.now() + 100000),
    createdAt: new Date(),
    user: mockUserEntity,
  };

  const mockTypeOrmRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenRepository,
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PasswordResetTokenRepository>(PasswordResetTokenRepository);
    typeOrmRepository = module.get<Repository<PasswordResetTokenEntity>>(getRepositoryToken(PasswordResetTokenEntity));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create and save a password reset token', async () => {
    mockTypeOrmRepository.save.mockResolvedValue(mockPasswordResetTokenEntity);
    const result = await repository.create(mockPasswordResetTokenEntity);
    expect(typeOrmRepository.save).toHaveBeenCalledWith(mockPasswordResetTokenEntity);
    expect(result).toEqual(mockPasswordResetTokenEntity);
  });

  it('should find a token by id', async () => {
    mockTypeOrmRepository.findOne.mockResolvedValue(mockPasswordResetTokenEntity);
    const result = await repository.findById('1234-5678');
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1234-5678' }, relations: ['user'] });
    expect(result).toEqual(mockPasswordResetTokenEntity);
  });

  it('should find an active token by user', async () => {
    mockTypeOrmRepository.findOne.mockResolvedValue(mockPasswordResetTokenEntity);
    const result = await repository.findActiveByUser(mockUserEntity);
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { user: mockUserEntity, isActive: true } });
    expect(result).toEqual(mockPasswordResetTokenEntity);
  });

  it('should revoke a token', async () => {
    await repository.revoke('1234-5678');
    expect(typeOrmRepository.update).toHaveBeenCalledWith('1234-5678', { isActive: false });
  });
});