import { LoginAudit } from 'src/auth/login-audit.entity';
import { CustomerProfile } from 'src/customers/customer-profile.entity';
import { Otp } from 'src/otp/otp.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string; 

  @Column({ default: false })
  isActive: boolean;

  // Relation to Profile
  @OneToOne(() => CustomerProfile, (profile) => profile.user)
  profile: CustomerProfile;

  @OneToMany(() => Otp, (otp) => otp.user)
  otp: Otp;

  // Relation to Audit Logs
  @OneToMany(() => LoginAudit, (audit) => audit.user)
  auditLogs: LoginAudit[];

  @CreateDateColumn()
  createdAt: Date;
}