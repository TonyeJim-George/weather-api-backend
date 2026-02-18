import { Module } from '@nestjs/common';
import { CustomerProfile } from './customer-profile.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CustomerProfile]),
        AuthModule,
    ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule {
}
