import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity()
export class LoginAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  attemptedEmail: string; // Store this even if user doesn't exist

  @Column()
  ipAddress: string;

  @Column()
  status: 'SUCCESS' | 'FAILURE';

  @Column({ nullable: true })
  failureReason: string;

  // Nullable because a failed login might come from a non-existent user
  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  user: User;

  @CreateDateColumn()
  timestamp: Date;
}