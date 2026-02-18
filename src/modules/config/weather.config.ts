import { registerAs } from '@nestjs/config';

export default registerAs('weather', () => ({
  apiKey: process.env.WEATHER_API_KEY,
  baseUrl: process.env.WEATHER_API_BASE_URL || 'https://weather.visualcrossing.com',
  unitGroup: process.env.WEATHER_UNIT_GROUP || 'metric', 
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 43200, 
}));
