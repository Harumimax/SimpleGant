import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateProjectDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название проекта' })
  @MaxLength(120, { message: 'Название должно быть не длиннее 120 символов' })
  name!: string;

  @IsDateString({ strict: true }, { message: 'Укажите корректную дату начала' })
  startDate!: string;

  @IsDateString({ strict: true }, { message: 'Укажите корректную дату окончания' })
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  excludeNonWorkingDays?: boolean;
}

export class UpdateProjectDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название проекта' })
  @MaxLength(120, { message: 'Название должно быть не длиннее 120 символов' })
  name?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату начала' })
  startDate?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату окончания' })
  endDate?: string;
}
