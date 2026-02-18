import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { LoginAudit } from 'src/auth/login-audit.entity';
import { CustomerProfile } from 'src/customers/customer-profile.entity';
import { Otp } from 'src/otp/otp.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.name'),
      
      // Load entities automatically or define them here
      entities: [User, CustomerProfile, LoginAudit, Otp], 

      synchronize: this.configService.get<boolean>('database.synchronize'),
    };
  }
}