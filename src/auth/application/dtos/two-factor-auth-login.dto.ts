import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class TwoFactorAuthLoginDto {
  @IsNumber({}, { message: 'O ID do usuário precisa ser um número.' })
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório.' })
  userId: number;

  @IsNotEmpty({ message: 'O código de autenticação é obrigatório.' })
  @IsString({ message: 'O código de autenticação deve ser uma string.' })
  @Length(6, 6, { message: 'O código de autenticação deve ter 6 dígitos.' })
  code: string;
}