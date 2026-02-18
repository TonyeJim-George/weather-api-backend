import { Exclude } from 'class-transformer';
import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity()
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  // The 'JoinColumn' indicates this side owns the relationship/foreign key
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn() 
  user: User;
}