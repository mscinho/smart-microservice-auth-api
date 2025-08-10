import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenRepository } from './refresh-token.repository';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let typeOrmRepository: Repository<RefreshTokenEntity>;

  const mockRefreshTokenEntity: RefreshTokenEntity = {
    id: '1234-5678',
    isActive: true,
    expiresAt: new Date(Date.now() + 100000),
    createdAt: new Date(),
    user: new UserEntity(),
    sessionCreatedAt: new Date()
  };

  const mockTypeOrmRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepository,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<RefreshTokenRepository>(RefreshTokenRepository);
    typeOrmRepository = module.get<Repository<RefreshTokenEntity>>(getRepositoryToken(RefreshTokenEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create and save a refresh token', async () => {
    mockTypeOrmRepository.save.mockResolvedValue(mockRefreshTokenEntity);
    const result = await repository.create(mockRefreshTokenEntity);
    expect(typeOrmRepository.save).toHaveBeenCalledWith(mockRefreshTokenEntity);
    expect(result).toEqual(mockRefreshTokenEntity);
  });

  it('should find a refresh token by id', async () => {
    mockTypeOrmRepository.findOne.mockResolvedValue(mockRefreshTokenEntity);
    const result = await repository.findById('1234-5678');
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1234-5678' }, relations: ['user'] });
    expect(result).toEqual(mockRefreshTokenEntity);
  });

  it('should revoke a refresh token', async () => {
    await repository.revoke('1234-5678');
    expect(typeOrmRepository.update).toHaveBeenCalledWith('1234-5678', { isActive: false });
  });
});