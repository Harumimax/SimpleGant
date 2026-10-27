import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MILESTONE_COLORS, type MilestoneColor } from './milestone.constants.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMilestoneDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название вехи' })
  @MaxLength(120, { message: 'Название должно быть не длиннее 120 символов' })
  title!: string;

  @IsDateString({ strict: true }, { message: 'Укажите корректную дату вехи' })
  date!: string;

  @IsOptional()
  @IsIn(MILESTONE_COLORS, { message: 'Выберите допустимый цвет вехи' })
  color?: MilestoneColor;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название вехи' })
  @MaxLength(120, { message: 'Название должно быть не длиннее 120 символов' })
  title?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату вехи' })
  date?: string;

  @IsOptional()
  @IsIn(MILESTONE_COLORS, { message: 'Выберите допустимый цвет вехи' })
  color?: MilestoneColor;
}
