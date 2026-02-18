import { Body, Controller, Ip, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
        return this.authService.login(loginDto, ipAddress);
    }
}


