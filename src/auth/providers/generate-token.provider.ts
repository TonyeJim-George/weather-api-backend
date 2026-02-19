import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenResponse } from '../interfaces/token.interface';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(
    user: { id: string; email: string; role: string },
  ): Promise<TokenResponse> {

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // ✅ Access token uses JwtModule default config
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN'),
    });

    // ✅ Refresh token overrides secret
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(), // keep your existing logic if needed
    };
  }
}
