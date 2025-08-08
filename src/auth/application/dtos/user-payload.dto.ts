import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class UserPayloadDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}