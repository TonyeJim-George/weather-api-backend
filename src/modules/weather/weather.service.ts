import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly unitGroup: string;
  private readonly ttl: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('weather.apiKey')!;
    this.baseUrl = this.configService.get<string>('weather.baseUrl')!;
    this.unitGroup = this.configService.get<string>('weather.unitGroup')!;
    this.ttl = this.configService.get<number>('weather.cacheTtlSeconds')!;
  }

  async getWeather(city: string) {
    const cacheKey = `weather:${city.toLowerCase()}`;

    // 1 Check Redis cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return {
        source: 'cache',
        data: JSON.parse(cachedData),
      };
    }

    // 2 Fetch from Visual Crossing API
    const response = await axios.get(
      `${this.baseUrl}/VisualCrossingWebServices/rest/services/timeline/${city}`,
      {
        params: {
          key: this.apiKey,
          unitGroup: this.unitGroup,
        },
      },
    );

    // 3 Save result to Redis cache
    await this.redisService.set(cacheKey, JSON.stringify(response.data), this.ttl);

    return {
      source: 'api',
      data: response.data,
    };
  }
}
