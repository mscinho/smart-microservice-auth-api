import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'O e-mail precisa ser válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;
}