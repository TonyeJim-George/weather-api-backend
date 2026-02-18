import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ConfigModule, RedisModule, AuthModule],
  providers: [WeatherService],
  controllers: [WeatherController],
})
export class WeatherModule {}
