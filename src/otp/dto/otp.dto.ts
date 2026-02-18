import { IsEmail, IsString } from "class-validator";

export class otpVerifyDto {

    @IsEmail()
    email: string;

    @IsString()
    code: string;
}