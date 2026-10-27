import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsArray,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { TASK_STATUSES, type TaskStatus } from './task.constants.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const optionalTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const nullableTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class CreateTaskDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название задачи' })
  @MaxLength(200, { message: 'Название должно быть не длиннее 200 символов' })
  title!: string;

  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(200)
  workType?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите ответственного' })
  @MaxLength(200, { message: 'Ответственный должен быть не длиннее 200 символов' })
  assignee!: string;

  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(100)
  estimate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Длительность должна быть целым числом дней' })
  @Min(1, { message: 'Длительность должна быть не меньше одного дня' })
  duration?: number;

  @IsOptional()
  @IsIn(TASK_STATUSES, { message: 'Выберите допустимый статус задачи' })
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату начала' })
  startDate?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату окончания' })
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  excludeWeekends?: boolean;

  @IsOptional()
  @IsObject({ message: 'Поля задачи должны быть объектом' })
  customFields?: Record<string, unknown>;
}

export class UpdateTaskDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название задачи' })
  @MaxLength(200, { message: 'Название должно быть не длиннее 200 символов' })
  title?: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(200)
  workType?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите ответственного' })
  @MaxLength(200, { message: 'Ответственный должен быть не длиннее 200 символов' })
  assignee?: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(100)
  estimate?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Длительность должна быть целым числом дней' })
  @Min(1, { message: 'Длительность должна быть не меньше одного дня' })
  duration?: number;

  @IsOptional()
  @IsIn(TASK_STATUSES, { message: 'Выберите допустимый статус задачи' })
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату начала' })
  startDate?: string | null;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Укажите корректную дату окончания' })
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCollapsed?: boolean;

  @IsOptional()
  @IsObject({ message: 'Поля задачи должны быть объектом' })
  customFields?: Record<string, unknown>;
}

export class TaskPositionDto {
  @IsUUID('4', { message: 'Некорректный идентификатор задачи' })
  id!: string;

  @ValidateIf((_object, value) => value !== null)
  @IsUUID('4', { message: 'Некорректный идентификатор родительской задачи' })
  parentId!: string | null;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskPositionDto)
  tasks!: TaskPositionDto[];
}
