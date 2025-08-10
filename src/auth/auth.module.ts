import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt/jwt-auth.guard';
import { AuthController } from './infrastructure/http/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './infrastructure/typeorm/refresh-token.entity';
import { RefreshTokenRepository } from './infrastructure/typeorm/refresh-token.repository';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { GenerateTwoFactorAuthSecretUseCase } from './application/use-cases/generate-2fa-secret.use-case';
import { VerifyTwoFactorAuthCodeUseCase } from './application/use-cases/verify-2fa-code.use-case';
import { VerifyTwoFactorAuthCodeOnLoginUseCase } from './application/use-cases/verify-2fa-code-on-login.use-case';
import { GoogleStrategy } from './infrastructure/google/google.strategy';
import { LoginWithGoogleUseCase } from './application/use-cases/login-with-google.use-case';

@Module({
  imports: [
    PassportModule,
    ConfigModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UsersModule
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    LoginUserUseCase,
    RefreshTokenUseCase,
    GenerateTwoFactorAuthSecretUseCase,
    VerifyTwoFactorAuthCodeUseCase,
    VerifyTwoFactorAuthCodeOnLoginUseCase,
    GoogleStrategy,
    LoginWithGoogleUseCase,
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository
    }
  ],
  controllers: [AuthController],
})
export class AuthModule {}