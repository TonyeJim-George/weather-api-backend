import { IsOptional, IsString, IsEmail, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'newemail@example.com', description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John', description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiProperty({ 
    example: 'NewPassword@123', 
    description: 'New password (minimum 8 characters)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdatePhoneNumberDto {
  @ApiProperty({ example: '08023102559', description: 'New phone number' })
  @IsString()
  @MinLength(10)
  phoneNumber: string;
}
