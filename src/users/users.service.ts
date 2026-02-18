import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import { CustomerProfile } from 'src/customers/customer-profile.entity';
import { RegisterResponse } from './interfaces/register.interface';
import { OtpService } from 'src/otp/otp.service';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { OtpPurpose } from 'src/otp/enums/otp.enum';
import { otpVerifyDto } from 'src/otp/dto/otp.dto';
import { ResetPasswordDto } from './dtos/verify-reset.dto';
import { RequestPasswordResetDto } from './dtos/request-passsword-reset.dto';
import { Role } from './enums/user-role.enum';


@Injectable()
export class UsersService {

    constructor(

        private dataSource: DataSource,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly otpService: OtpService,

        private readonly hashingProvider: HashingProvider,
    ) {}

    async registerUser(registerDto: RegisterDto, role: Role = Role.CUSTOMER): Promise<RegisterResponse> {

            // 1. Create the QueryRunner
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            let savedUser: User;
            let newProfile: CustomerProfile;

            try {
            // 2. Prepare Data

            const existingEmail = await queryRunner.manager.findOne(User, 
                { where: 
                    { email: registerDto.email } 
                });

            if (existingEmail) {
                throw new ConflictException('User already exists');
            }

            const existingPhone = await queryRunner.manager.findOne(CustomerProfile,
                { where: 
                    { phoneNumber: registerDto.phoneNumber } 
                });

            if (existingPhone) {
                throw new ConflictException('Phone number already exists');
            }

            const hashedPassword = await this.hashingProvider.hash(registerDto.password, 10);

            // 3. Save User (Inside Transaction)
            const newUser = queryRunner.manager.create(User, { 
                email: registerDto.email, 
                passwordHash: hashedPassword,
                role: role, 
            });
            savedUser = await queryRunner.manager.save(newUser);

            // 4. Save Profile (Inside Transaction) linked to User
            newProfile = queryRunner.manager.create(CustomerProfile, {
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                phoneNumber: registerDto.phoneNumber,
                user: savedUser,
            });
            await queryRunner.manager.save(newProfile);


            // 5. Commit Transaction
            await queryRunner.commitTransaction();

            } catch (err) {

                if (err instanceof ConflictException) {
                    throw err;
                }
                // 6. Rollback on Error (Clean up partial data)
                await queryRunner.rollbackTransaction();
                
                if (err.code === '23505') { // Postgres unique violation code
                    throw new ConflictException('Email already exists');
                }
                throw new InternalServerErrorException();
                } finally {
                // 7. Release connection
                await queryRunner.release();
                }

                try {
                    if(savedUser.isActive === false){
                        await this.otpService.generateOtp(savedUser.email, OtpPurpose.ACCOUNT_ACTIVATION);
                    }
                } catch (otpError) {
                    console.error('Failed to send OTP:', otpError);
                    // Optional: You could return a warning message here
                }

                const safeUser = {
                    id: savedUser.id,
                    email: savedUser.email,
                    isActive: savedUser.isActive,
                    createdAt: savedUser.createdAt,
                };
                
                return {
                message: 'User registered successfully',
                user: safeUser,
                profile: {
                    id: newProfile.id,
                    firstName: newProfile.firstName,
                    lastName: newProfile.lastName,
                    phoneNumber: newProfile.phoneNumber
                }
            };
        }

        async getAllUsers(): Promise<RegisterResponse[]> {
            const users = await this.userRepository.find({ relations: ['profile'] });
            return users.map(user => ({
                message: 'User retrieved successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                },
                profile: user.profile
            }));
        }

        async findByEmail(email: string): Promise<User | null> {
            return this.userRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'passwordHash', 'role', 'isActive'] });
        }

        async activateAccount(verifydto: otpVerifyDto) {
            const user = await this.otpService.verifyOtp(
                verifydto.email,
                verifydto.code,
                OtpPurpose.ACCOUNT_ACTIVATION,
            );

            if(!user){
                throw new ConflictException('Account cannot be verified');

            }

            user.isActive = true;
            await this.userRepository.save(user);

            return { message: 'Account verified successfully' };
    }

    async requestAccountActivation(requestresetDto: RequestPasswordResetDto) {
        return this.otpService.generateOtp(
        requestresetDto.email,
        OtpPurpose.ACCOUNT_ACTIVATION,
        );
    }

    async requestPasswordReset(requestresetDto: RequestPasswordResetDto) {
        return this.otpService.generateOtp(
        requestresetDto.email,
        OtpPurpose.PASSWORD_RESET,
        );
    }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.otpService.verifyOtp(
      resetPasswordDto.email,
      resetPasswordDto.code,
      OtpPurpose.PASSWORD_RESET,
    );

    if(!user){
        throw new ConflictException('Otp not verified');
    }

    const hashedPassword = await this.hashingProvider.hash(resetPasswordDto.newPassword, 10);

    user.passwordHash = hashedPassword;

    await this.userRepository.save(user);

    return { message: 'Password reset successful' };
  }
  //important

}