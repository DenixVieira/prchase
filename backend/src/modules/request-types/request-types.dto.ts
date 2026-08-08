import { Type } from "class-transformer";
import {
  IsString, IsOptional, IsUUID, IsBoolean, MaxLength, IsEnum, IsArray,
  IsInt, Min, ValidateNested, ArrayMaxSize,
} from "class-validator";
import { RequestFieldType } from "../../database/entities";

export class CreateRequestTypeDto {
  @IsString() @MaxLength(150) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsUUID() departmentId!: string;
  @IsOptional() @IsString() @MaxLength(60) icon?: string;
  /** Organizações pra quais este tipo fica visível — vazio/omitido = oculto até configurar. */
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) organizationIds?: string[];
  /** Restrição extra opcional por departamento — vazio/omitido = sem restrição além da organização. */
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) visibleDepartmentIds?: string[];
}

export class UpdateRequestTypeDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() @MaxLength(60) icon?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) organizationIds?: string[];
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) visibleDepartmentIds?: string[];
}

class RequestFieldOptionDto {
  @IsString() @MaxLength(150) label!: string;
  @IsString() @MaxLength(150) value!: string;
}

export class RequestFieldDto {
  @IsString() @MaxLength(150) label!: string;
  /** Opcional — se omitido, o service gera a partir da label (slug). */
  @IsOptional() @IsString() @MaxLength(100) key?: string;
  @IsEnum(RequestFieldType) type!: RequestFieldType;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => RequestFieldOptionDto) options?: RequestFieldOptionDto[];
  @IsOptional() @IsString() @MaxLength(255) helpText?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

export class ReplaceRequestFieldsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RequestFieldDto)
  fields!: RequestFieldDto[];
}
