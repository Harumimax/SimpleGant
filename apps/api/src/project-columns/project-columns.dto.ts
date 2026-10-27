import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ProjectColumnConfigurationDto {
  @IsOptional()
  @IsUUID('4', { message: 'Некорректный идентификатор колонки' })
  id?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Укажите название колонки' })
  @MaxLength(80, { message: 'Название колонки должно быть не длиннее 80 символов' })
  name!: string;

  @IsBoolean()
  isVisible!: boolean;
}

export class ConfigureProjectColumnsDto {
  @IsArray()
  @ArrayMinSize(5, { message: 'Системные колонки нельзя удалить' })
  @ArrayMaxSize(10, { message: 'В проекте может быть не более 10 колонок' })
  @ValidateNested({ each: true })
  @Type(() => ProjectColumnConfigurationDto)
  columns!: ProjectColumnConfigurationDto[];
}
