import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from 'src/users/dtos/register.dto';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/user-role.enum';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    @Post('login')
    @ApiOperation({ summary: 'User login', description: 'Authenticate user and return access and refresh tokens' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login successful with tokens' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiHeader({ name: 'x-forwarded-for', description: 'Client IP address (optional)' })
    async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
        return this.authService.login(loginDto, ipAddress);
    }

  @Post('register/admin')
  @ApiOperation({ summary: 'Register admin user', description: 'Create a new admin account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or phone number already exists' })
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.usersService.registerUser(dto, Role.ADMIN);
  }

  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Get a new access token using a valid refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('login-audit')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get login audit logs', description: 'Retrieve all login attempts (admin only)' })
  @ApiResponse({ status: 200, description: 'Login audit logs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getLoginAudit() {
    return await this.authService.getLoginAudit();
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'User logout', description: 'Invalidate current access token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: any) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(req.user.sub, token);
    return { message: 'Successfully logged out' };
  }

}


