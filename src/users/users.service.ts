import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
import { UpdateUserDto } from './dtos/update-user.dto';
import { Otp } from 'src/otp/otp.entity';
import { UpdatePhoneNumberDto } from './dtos/update-user.dto';


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

        async getUserByEmail(email: string): Promise<RegisterResponse> {
            const user = await this.userRepository.findOne({ where: { email }, relations: ['profile'] });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            return {
                message: 'User retrieved successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                },
                profile: user.profile
            };
        }

        async findByEmail(email: string): Promise<User | null> {
            return this.userRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'passwordHash', 'role', 'isActive'] });
        }

        async findOneById(id: string): Promise<User | null> {
            return this.userRepository.findOne({ where: { id } });
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
        const user = await this.findByEmail(requestresetDto.email);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isActive) {
            throw new BadRequestException('Account is already active');
        }

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

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new email already exists (if email is being updated)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateUserDto.email;
    }

    // Update password if provided
    if (updateUserDto.password) {
      user.passwordHash = await this.hashingProvider.hash(updateUserDto.password, 10);
    }

    // Update user record
    await this.userRepository.save(user);

    // Update profile if firstName or lastName provided
    if (updateUserDto.firstName || updateUserDto.lastName) {
      if (user.profile) {
        if (updateUserDto.firstName) {
          user.profile.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
          user.profile.lastName = updateUserDto.lastName;
        }
        await this.dataSource.getRepository(CustomerProfile).save(user.profile);
      }
    }

    return {
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
      profile: user.profile,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete OTPs belonging to this user (use QueryBuilder because entity property is a relation)
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Otp)
      .where('"userId" = :id', { id: user.id })
      .execute();

    // Delete related profile first
    if (user.profile) {
      await this.dataSource.getRepository(CustomerProfile).remove(user.profile);
    }

    // Delete user
    await this.userRepository.remove(user);

    return { message: 'User deleted successfully', userId };
  }

  async updateCustomerPhoneNumber(userId: string, updatePhoneNumberDto: UpdatePhoneNumberDto) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      throw new NotFoundException('User profile not found');
    }

    // Check if phone number already exists
    const existingPhoneNumber = await this.dataSource.getRepository(CustomerProfile).findOne({
      where: { phoneNumber: updatePhoneNumberDto.phoneNumber },
    });

    if (existingPhoneNumber && existingPhoneNumber.id !== user.profile.id) {
      throw new ConflictException('Phone number already in use');
    }

    user.profile.phoneNumber = updatePhoneNumberDto.phoneNumber;
    await this.dataSource.getRepository(CustomerProfile).save(user.profile);

    return {
      message: 'Phone number updated successfully',
      profile: {
        id: user.profile.id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phoneNumber: user.profile.phoneNumber,
      },
    };
  }

}