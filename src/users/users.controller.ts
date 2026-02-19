import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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

@ApiTags('Users')
@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ) {}

    @Post('register')
    @ApiOperation({ summary: 'Register new user', description: 'Create a new customer account' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email or phone number already exists' })
    async registerUser(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
        return await this.usersService.registerUser(registerDto);
    }

    
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Get all users', description: 'Retrieve all users (admin only)' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async getAllUsers(): Promise<RegisterResponse[]> {
        return await this.usersService.getAllUsers();
    }

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':email')
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Get user by email', description: 'Retrieve user details by email (admin only)' })
    @ApiParam({ name: 'email', description: 'User email address' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserByEmail(@Param('email') email: string): Promise<RegisterResponse> {
        return await this.usersService.getUserByEmail(email);
    }

    @Post('request-account-activation')
    @ApiOperation({ summary: 'Request account activation', description: 'Send OTP to email for account activation' })
    @ApiBody({ type: RequestPasswordResetDto })
    @ApiResponse({ status: 200, description: 'OTP sent to email' })
    async requestAccountActivation(@Body() requestresetDto: RequestPasswordResetDto) {
        return await this.usersService.requestAccountActivation(requestresetDto);
     }

    @Post('activate-account')
    @ApiOperation({ summary: 'Activate account', description: 'Verify OTP and activate user account' })
    @ApiBody({ type: otpVerifyDto })
    @ApiResponse({ status: 200, description: 'Account activated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid OTP' })
    async activateAccount(@Body() verifydto: otpVerifyDto ){
        return await this.usersService.activateAccount(verifydto);
    }

    @Post('request-reset')
    @ApiOperation({ summary: 'Request password reset', description: 'Send OTP to email for password reset' })
    @ApiBody({ type: RequestPasswordResetDto })
    @ApiResponse({ status: 200, description: 'OTP sent to email' })
    async requestReset(@Body() requestResetDto: RequestPasswordResetDto){
        return await this.usersService.requestPasswordReset(requestResetDto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password', description: 'Reset password using OTP verification' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid OTP' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto ){
        return await this.usersService.resetPassword(resetPasswordDto);
    }

    @UseGuards(AccessTokenGuard)
    @Put(':id')
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Update user profile', description: 'Update user information' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async updateUser(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
        return await this.usersService.updateUser(userId, updateUserDto);
    }

    @UseGuards(AccessTokenGuard)
    @Put('update-profile/:id')
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Update user profile (owner or admin)', description: 'Update user information (owner of account or admin)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only owner or admin can update' })
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
    @Delete(':id')
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Delete user', description: 'Delete user and associated data (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID to delete' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async deleteUser(@Param('id') userId: string) {
        return await this.usersService.deleteUser(userId);
    }

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id/phone-number')
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Update customer phone number', description: 'Update user phone number (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiBody({ type: UpdatePhoneNumberDto })
    @ApiResponse({ status: 200, description: 'Phone number updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async updateCustomerPhoneNumber(
        @Param('id') userId: string,
        @Body() updatePhoneNumberDto: UpdatePhoneNumberDto,
    ) {
        return await this.usersService.updateCustomerPhoneNumber(userId, updatePhoneNumberDto);
    }
}

