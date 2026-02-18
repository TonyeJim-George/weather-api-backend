import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { OtpPurpose } from './enums/otp.enum';

@Entity()
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codeHash: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({
  type: 'enum',
  enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  // Link to User (One User has One Active OTP at a time usually, or One-to-Many if you keep history)
  // For activation, One-to-One is sufficient if we overwrite old ones.
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}