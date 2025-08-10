import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';


describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  // Mock do ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'GOOGLE_CLIENT_ID':
          return 'mock-client-id';
        case 'GOOGLE_CLIENT_SECRET':
          return 'mock-client-secret';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // Teste de Sucesso
  it('should validate and return the user email from the Google profile', () => {
    const accessToken = 'mock-access-token';
    const refreshToken = 'mock-refresh-token';
    const profile = {
      emails: [{ value: 'test@google.com' }],
    };

    const result = strategy.validate(accessToken, refreshToken, profile as any);

    expect(result).toBe('test@google.com');
  });
});