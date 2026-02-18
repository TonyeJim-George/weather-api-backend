import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { TokenResponse } from '../interfaces/token.interface';

@Injectable()
export class GenerateTokenProvider {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(
    user: { id: string; email: string },
  ): Promise<TokenResponse> {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT secrets are missing');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessTokenExpiresIn: JwtSignOptions['expiresIn'] = (
      process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'
    ) as JwtSignOptions['expiresIn'];

    const refreshTokenExpiresIn: JwtSignOptions['expiresIn'] = (
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
    ) as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        this.parseExpiresInToSeconds(String(accessTokenExpiresIn)),
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  private parseExpiresInToSeconds(expiresIn: string): number {
    const value = parseInt(expiresIn, 10);

    if (expiresIn.endsWith('s')) return value;
    if (expiresIn.endsWith('m')) return value * 60;
    if (expiresIn.endsWith('h')) return value * 60 * 60;
    if (expiresIn.endsWith('d')) return value * 60 * 60 * 24;

    return value; // fallback: seconds
  }
}
