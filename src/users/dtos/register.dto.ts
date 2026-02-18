import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  Matches, 
  IsOptional, 
  MaxLength 
} from 'class-validator';

export class RegisterDto {
  // 1. User Account Details
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // Regex: At least one uppercase, one lowercase, one number/special char
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. It must contain uppercase, lowercase, and a number or special character.',
  })
  password: string;

  // 2. Customer Profile Details
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  // Optional: Matches international phone format (e.g., +1234567890)
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}