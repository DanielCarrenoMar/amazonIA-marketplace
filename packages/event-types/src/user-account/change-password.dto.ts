import { IsString, IsNotEmpty, MinLength, Matches, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @MaxLength(255)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'La nueva contraseña debe tener al menos una letra mayúscula y un número' })
  newPassword: string;
}
