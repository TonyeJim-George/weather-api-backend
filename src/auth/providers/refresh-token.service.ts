import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GenerateTokenProvider } from './generate-token.provider';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RefreshTokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly generateTokenProvider: GenerateTokenProvider,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  public async refreshTokens(refreshToken: string) {
    try {
      // 1. Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // 2. Fetch user from database to ensure they still exist/are active
      const user = await this.usersService.findOneById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User no longer exists or is inactive');
      }

      // 3. Generate new pair of tokens
      return await this.generateTokenProvider.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}