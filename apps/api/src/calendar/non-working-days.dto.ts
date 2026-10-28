import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

const optionalTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

export class CreateNonWorkingDayDto {
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату' })
  date!: string;

  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(120, { message: 'Название должно быть не длиннее 120 символов' })
  label?: string;
}
