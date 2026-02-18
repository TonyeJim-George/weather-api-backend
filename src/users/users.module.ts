import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from 'src/otp/otp.service';
import { Otp } from 'src/otp/otp.entity';
import { MailService } from 'src/mail/mail.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, OtpService, MailService],
  imports: [TypeOrmModule.forFeature([User, Otp]), forwardRef(() => AuthModule)],
  exports: [UsersService],
})
export class UsersModule {}
