import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dtos/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginAudit } from './login-audit.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { HashingProvider } from './providers/hashing.provider';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { OtpService } from 'src/otp/otp.service';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RefreshTokenProvider } from './providers/refresh-token.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { convertExpirationToSeconds } from './utils/convert-expiration-to-seconds';


@Injectable()
export class AuthService {
  constructor(
    
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    @InjectRepository(LoginAudit)
    private readonly loginAuditRepo: Repository<LoginAudit>,

    private readonly hashingProvider: HashingProvider,

    private readonly generateTokenProvider: GenerateTokenProvider,

    private readonly otpService: OtpService,

    private readonly refreshTokenProvider: RefreshTokenProvider,

    private readonly redisService: RedisService,

    private readonly configService: ConfigService,
 
  ) {}

  private async logLoginAttempt(params: {
    email: string;
    ipAddress: string;
    status: 'SUCCESS' | 'FAILURE';
    failureReason?: string;
    user?: User;
  }) {
    const audit = this.loginAuditRepo.create({
      attemptedEmail: params.email,
      ipAddress: params.ipAddress,
      status: params.status,
      failureReason: params.failureReason,
      user: params.user,
    });

    await this.loginAuditRepo.save(audit);
  }


  async validateUser(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (user && user.isActive === true && await this.hashingProvider.compare(loginDto.password, user.passwordHash)) {

        const { passwordHash: _, ...safeUser } = user;

        return safeUser;
    }

    return null;

  }

  async login(loginDto: LoginDto, ipAddress: string) {

    const user = await this.validateUser(loginDto);

    if(!user) {

        const existingUser = await this.usersService.findByEmail(loginDto.email);

        if(existingUser) {
            if(existingUser.isActive === false) {
                await this.logLoginAttempt({
                    email: loginDto.email,
                    ipAddress,
                    status: 'FAILURE',
                    failureReason: 'ACCOUNT_INACTIVE',
                    user: existingUser,
                });
                throw new UnauthorizedException('Account is inactive. Please verify your email.');
            } else {
                await this.logLoginAttempt({
                    email: loginDto.email,
                    ipAddress,
                    status: 'FAILURE',
                    failureReason: 'INCORRECT_PASSWORD',
                    user: existingUser,
                });
            }
        } else {
            await this.logLoginAttempt({
                email: loginDto.email,
                ipAddress,
                status: 'FAILURE',
                failureReason: 'USER_NOT_EXISTING',
            });
        }
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenProvider.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Invalidate previous access tokens for this user
    await this.invalidatePreviousTokens(user.id);

    // Store the new token in Redis as the active token for this user
    const tokenTTL = convertExpirationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    );
    await this.redisService.set(`user:${user.id}:active_token`, tokens.accessToken, tokenTTL);

    await this.logLoginAttempt({
      email: user.email,
      ipAddress,
      status: 'SUCCESS',
      user: user as User,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      user,
    };
  }

  private async invalidatePreviousTokens(userId: string) {
    // Get the old token if it exists and add it to blacklist
    const oldToken = await this.redisService.get(`user:${userId}:active_token`);
    if (oldToken) {
      // Get the token TTL and add old token to blacklist
      const tokenTTL = convertExpirationToSeconds(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
      );
      await this.redisService.set(`token:blacklist:${oldToken}`, 'revoked', tokenTTL);
    }
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    return await this.refreshTokenProvider.refreshTokens(refreshTokenDto.refreshToken);
  }

  async getLoginAudit() {
    return await this.loginAuditRepo.find({
      relations: ['user'],
      order: {
        timestamp: 'DESC',
      },
    });
  }

  async logout(userId: string, token: string) {
    const tokenTTL = convertExpirationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    );
    // Add token to blacklist to immediately invalidate it
    await this.redisService.set(`token:blacklist:${token}`, 'revoked', tokenTTL);
    // Remove from active tokens
    await this.redisService.delete(`user:${userId}:active_token`);
  }

}
