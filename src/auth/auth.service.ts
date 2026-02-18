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
        }     
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenProvider.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      user,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    return await this.refreshTokenProvider.refreshTokens(refreshTokenDto.refreshToken);
  }

}
