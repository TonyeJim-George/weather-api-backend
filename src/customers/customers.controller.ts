// customers/customers.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';

import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(AccessTokenGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.customersService.getProfile(req.user.sub);
  }
}
