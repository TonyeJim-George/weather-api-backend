import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  Matches, 
  IsOptional, 
  MaxLength 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  // 1. User Account Details
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    example: 'Password@123', 
    description: 'Password must contain uppercase, lowercase, number/special char, and be at least 8 characters' 
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // Regex: At least one uppercase, one lowercase, one number/special char
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. It must contain uppercase, lowercase, and a number or special character.',
  })
  password: string;

  // 2. Customer Profile Details
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  // Optional: Matches international phone format (e.g., +1234567890)
  @ApiProperty({ example: '08023102559', description: 'Customer phone number (optional)', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}