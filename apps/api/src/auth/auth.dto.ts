import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Введите корректный email' })
  @MaxLength(320, { message: 'Email слишком длинный' })
  email!: string;

  @IsString()
  @MinLength(10, { message: 'Пароль должен содержать минимум 10 символов' })
  @MaxLength(72, { message: 'Пароль должен содержать не более 72 символов' })
  password!: string;
}
