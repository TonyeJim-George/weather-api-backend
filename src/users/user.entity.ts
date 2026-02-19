import { LoginAudit } from 'src/auth/login-audit.entity';
import { CustomerProfile } from 'src/customers/customer-profile.entity';
import { Otp } from 'src/otp/otp.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { Role } from './enums/user-role.enum';

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

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER, // Sets default to customer
  })
  role: Role;

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

  @DeleteDateColumn() 
  deletedAt: Date;
}