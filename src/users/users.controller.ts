import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { RegisterResponse } from './interfaces/register.interface';
import { otpVerifyDto } from 'src/otp/dto/otp.dto';
import { ResetPasswordDto } from './dtos/verify-reset.dto';
import { RequestPasswordResetDto } from './dtos/request-passsword-reset.dto';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ) {}

    @Post('register')
    async registerUser(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
        return await this.usersService.registerUser(registerDto);
    }

    @Get()
    async getAllUsers(): Promise<RegisterResponse[]> {
        return await this.usersService.getAllUsers();
    }

    @Post('request-account-activation')
    async requestAccountActivation(@Body() requestresetDto: RequestPasswordResetDto) {
        return await this.usersService.requestAccountActivation(requestresetDto);
     }

    @Post('activate-account')
    async activateAccount(@Body() verifydto: otpVerifyDto ){
        return await this.usersService.activateAccount(verifydto);
    }

    @Post('request-reset')
    async requestReset(@Body() requestResetDto: RequestPasswordResetDto){
        return await this.usersService.requestPasswordReset(requestResetDto);
    }

    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto ){
        return await this.usersService.resetPassword(resetPasswordDto);
    }
}
