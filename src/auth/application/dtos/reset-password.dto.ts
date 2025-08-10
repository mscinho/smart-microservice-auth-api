import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'O token de recuperação é obrigatório.' })
  @IsNotEmpty({ message: 'O token de recuperação é obrigatório.' })
  token: string;

  @IsString({ message: 'A nova senha precisa ser válida.' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  newPassword: string;
}