import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { MILESTONE_COLORS } from '../milestones/milestone.constants.js';
import { TASK_COLORS, TASK_STATUSES } from '../tasks/task.constants.js';
import {
  MAX_PROJECT_STICKERS,
  MAX_STICKER_SIZE,
  MIN_STICKER_SIZE,
  STICKER_ANCHOR_AREAS,
  STICKER_COLORS,
} from './sticker.constants.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const nullableTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
};

export class GanttColumnDto {
  @IsUUID('4')
  id!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsBoolean()
  isVisible!: boolean;
}

export class GanttTaskPeriodDto {
  @IsUUID('4')
  id!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsDateString({ strict: true })
  startDate!: string;

  @IsDateString({ strict: true })
  endDate!: string;

  @IsBoolean()
  includeInDuration!: boolean;

  @IsIn(TASK_COLORS)
  color!: string;
}

export class GanttTaskDto {
  @IsUUID('4')
  id!: string;

  @ValidateIf((_object, value) => value !== null)
  @IsUUID('4')
  parentId!: string | null;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ValidateIf((_object, value) => value !== null)
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(200)
  workType!: string | null;

  @Transform(trim)
  @IsString()
  @MaxLength(200)
  assignee!: string;

  @ValidateIf((_object, value) => value !== null)
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(100)
  estimate!: string | null;

  @ValidateIf((_object, value) => value !== null)
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(1000)
  comment!: string | null;

  @IsIn(TASK_STATUSES)
  status!: string;

  @ValidateIf((_object, value) => value !== null)
  @IsDateString({ strict: true })
  startDate!: string | null;

  @ValidateIf((_object, value) => value !== null)
  @IsDateString({ strict: true })
  endDate!: string | null;

  @IsIn(TASK_COLORS)
  color!: string;

  @IsBoolean()
  includeInDuration!: boolean;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => GanttTaskPeriodDto)
  periods!: GanttTaskPeriodDto[];

  @IsBoolean()
  isCollapsed!: boolean;

  @IsObject()
  customFields!: Record<string, unknown>;
}

export class GanttMilestoneDto {
  @IsUUID('4')
  id!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsDateString({ strict: true })
  date!: string;

  @IsIn(MILESTONE_COLORS)
  color!: string;
}

export class GanttNonWorkingDayDto {
  @IsUUID('4')
  id!: string;

  @IsDateString({ strict: true })
  date!: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(120)
  label?: string | null;
}

export class GanttStickerDto {
  @IsUUID('4')
  id!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;

  @IsIn(STICKER_COLORS)
  color!: string;

  @IsIn(STICKER_ANCHOR_AREAS)
  anchorArea!: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  xDayOffset!: number;

  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000)
  xTaskOffset!: number | null;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(200)
  yRowOffset!: number;

  @IsInt()
  @Min(MIN_STICKER_SIZE)
  @Max(MAX_STICKER_SIZE)
  size!: number;

  @IsInt()
  @Min(0)
  @Max(10_000)
  zIndex!: number;
}

export class UpdateGanttDto {
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => GanttColumnDto)
  columns!: GanttColumnDto[];

  @IsArray()
  @ArrayMaxSize(150)
  @ValidateNested({ each: true })
  @Type(() => GanttTaskDto)
  tasks!: GanttTaskDto[];

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => GanttMilestoneDto)
  milestones!: GanttMilestoneDto[];

  @IsArray()
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => GanttNonWorkingDayDto)
  nonWorkingDays!: GanttNonWorkingDayDto[];

  @IsArray()
  @ArrayMaxSize(MAX_PROJECT_STICKERS)
  @ValidateNested({ each: true })
  @Type(() => GanttStickerDto)
  stickers!: GanttStickerDto[];
}
