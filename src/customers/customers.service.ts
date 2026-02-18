import { Repository } from "typeorm";
import { CustomerProfile } from "./customer-profile.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";

// customers/customers.service.ts
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly customerRepo: Repository<CustomerProfile>,
  ) {}


  async getProfile(userId: string) {
  const profile = await this.customerRepo.findOne({
    where: {
      user: { id: userId },
    },
    relations: ['user'],
  });

  if (!profile) {
    throw new NotFoundException('Profile not found');
  }

  return profile;
}

}