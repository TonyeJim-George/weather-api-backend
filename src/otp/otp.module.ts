import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { Otp } from './otp.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { MailService } from 'src/mail/mail.service';
import { BcryptProvider } from 'src/auth/providers/bcrypt.provider';
import { HashingProvider } from 'src/auth/providers/hashing.provider';

@Module({
  providers: [OtpService, MailService, 
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    }
  ],
  controllers: [OtpController],
  imports: [TypeOrmModule.forFeature([Otp, User]),],
  exports: [OtpService],
})
export class OtpModule {}
