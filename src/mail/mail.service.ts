import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OtpPurpose } from 'src/otp/enums/otp.enum'; // Import your enum

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<void> {
    let subject = 'Your Verification Code';
    let content = `Your OTP is: ${otp}`;

    // Customize based on purpose
    if (purpose === OtpPurpose.ACCOUNT_ACTIVATION) {
      subject = 'Activate Your Account';
      content = `Welcome! Use this code to verify your email and activate your account: <h3>${otp}</h3>`;
    } else if (purpose === OtpPurpose.PASSWORD_RESET) {
      subject = 'Password Reset Request';
      content = `We received a request to reset your password. Use this code to proceed: <h3>${otp}</h3><p>If you didn't request this, please ignore this email.</p>`;
    }

    const mailOptions = {
      from: `"App Support" <${process.env.MAIL_FROM}>`,
      to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>${subject}</h2>
          ${content}
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This code expires in 15 minutes.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Could not send OTP email.');
    }
  }
}