import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorAuthCodeDto {
  @IsNotEmpty({ message: 'O código de autenticação é obrigatório.' })
  @IsString({ message: 'O código de autenticação deve ser uma string.' })
  @Length(6, 6, { message: 'O código de autenticação deve ter 6 dígitos.' })
  code: string;
}