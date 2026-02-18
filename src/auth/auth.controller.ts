import { Body, Controller, Ip, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from 'src/users/dtos/register.dto';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/user-role.enum';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
        return this.authService.login(loginDto, ipAddress);
    }

  @Post('register/admin')
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.usersService.registerUser(dto, Role.ADMIN);
  }
}


