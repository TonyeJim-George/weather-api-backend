import { IsOptional, IsString, IsEmail, MinLength, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdatePhoneNumberDto {
  @IsString()
  @MinLength(10)
  phoneNumber: string;
}
