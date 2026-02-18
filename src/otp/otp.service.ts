import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Otp } from './otp.entity';
import { User } from 'src/users/user.entity';
import { MailService } from 'src/mail/mail.service';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { OtpPurpose } from './enums/otp.enum';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) 
    private otpRepo: Repository<Otp>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private readonly mailService: MailService, 

    private readonly hashingProvider: HashingProvider,
  ) {}

  // 1. Generate and Save OTP
  async generateOtp(email: string, purpose: OtpPurpose) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await this.hashingProvider.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.otpRepo.delete({
      user: { id: user.id },
      purpose,
    });

    const otp = this.otpRepo.create({
      codeHash,
      expiresAt,
      user,
      purpose,
    });

    await this.otpRepo.save(otp);

    await this.mailService.sendOtpEmail(user.email, code, purpose);

    console.log('Your otp is: ', code)

    return { message: 'OTP sent successfully' };
  }


  async verifyOtp(email: string, code: string, purpose: OtpPurpose) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpRecord = await this.otpRepo.findOne({
      where: {
        user: { id: user.id },
        purpose,
        expiresAt: MoreThan(new Date()),
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const isMatch = await this.hashingProvider.compare(code, otpRecord.codeHash);

    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    otpRecord.isUsed = true;
    await this.otpRepo.save(otpRecord);

    return user; // 🔥 Just return user
  }

}