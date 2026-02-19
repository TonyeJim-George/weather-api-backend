import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { RegisterResponse } from './interfaces/register.interface';
import { otpVerifyDto } from 'src/otp/dto/otp.dto';
import { ResetPasswordDto } from './dtos/verify-reset.dto';
import { RequestPasswordResetDto } from './dtos/request-passsword-reset.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from './enums/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdatePhoneNumberDto } from './dtos/update-user.dto';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ) {}

    @Post('register')
    async registerUser(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
        return await this.usersService.registerUser(registerDto);
    }

    
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    async getAllUsers(): Promise<RegisterResponse[]> {
        return await this.usersService.getAllUsers();
    }

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':email')
    async getUserByEmail(@Param('email') email: string): Promise<RegisterResponse> {
        return await this.usersService.getUserByEmail(email);
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

    @UseGuards(AccessTokenGuard)
    @Put(':id')
    async updateUser(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
        return await this.usersService.updateUser(userId, updateUserDto);
    }

    @UseGuards(AccessTokenGuard)
    @Put('update-profile/:id')
    async updateProfile(
        @Param('id') userId: string,
        @Body() updateUserDto: UpdateUserDto,
        @Req() req: any,
    ) {
        const requester = req.user;
        if (!requester) {
            throw new ForbiddenException('Not allowed');
        }
        if (requester.sub !== userId && requester.role !== Role.ADMIN) {
            throw new ForbiddenException('Not allowed');
        }
        return await this.usersService.updateUser(userId, updateUserDto);
    }

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete('delete-user/:id')
    async deleteUser(@Param('id') userId: string) {
        return await this.usersService.deleteUser(userId);
    }

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id/phone-number')
    async updateCustomerPhoneNumber(
        @Param('id') userId: string,
        @Body() updatePhoneNumberDto: UpdatePhoneNumberDto,
    ) {
        return await this.usersService.updateCustomerPhoneNumber(userId, updatePhoneNumberDto);
    }
}
