import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from './config/database.config';
import { OtpModule } from './otp/otp.module';
import { MailModule } from './mail/mail.module';
import { WeatherModule } from './modules/weather/weather.module';
import { RedisModule } from './modules/redis/redis.module';
import jwtConfig from './config/jwt.config';
import weatherConfig from './modules/config/weather.config';

@Module({
  imports: [UsersModule, AuthModule, CustomersModule, 
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configuration, jwtConfig, weatherConfig],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService, // Use our custom config class
      inject: [DatabaseConfigService],
    }),
    OtpModule,
    MailModule,
    WeatherModule,
    RedisModule
  ],
  controllers: [],
  providers: [DatabaseConfigService],
})
export class AppModule {}
