import { Controller, Get, Query, ValidationPipe, UsePipes, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { GetWeatherDto } from './dto/weather.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';


@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessTokenGuard)
  async getWeather(@Query() query: GetWeatherDto) {
    const { city } = query;
    return this.weatherService.getWeather(city);
  }
}
