import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAudit } from './login-audit.entity';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { OtpModule } from 'src/otp/otp.module';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenProvider } from './providers/refresh-token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    GenerateTokenProvider, AccessTokenGuard, RefreshTokenProvider,
  ],
  imports: [PassportModule, TypeOrmModule.forFeature([LoginAudit]), forwardRef(() => UsersModule),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get('JWT_ACCESS_SECRET'),
      signOptions: {
        expiresIn: config.get('JWT_ACCESS_EXPIRES_IN'),
      },
    }),
  }),
  OtpModule,
],
  exports: [AuthService, HashingProvider, JwtModule],
})
export class AuthModule {}
