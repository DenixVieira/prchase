import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength, IsEnum, IsArray } from "class-validator";
import { PermissionKey } from "../../database/entities";

export class CreateDepartmentDto {
  @IsString() @MaxLength(150) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() responsibleUserId?: string;
  @IsOptional() @IsUUID() homeOrganizationId?: string;
  @IsOptional() @IsBoolean() hasFullOrganizationAccess?: boolean;
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) allowedOrganizationIds?: string[];
  @IsOptional() @IsUUID() departmentGroupId?: string;
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() responsibleUserId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsUUID() homeOrganizationId?: string;
  @IsOptional() @IsBoolean() hasFullOrganizationAccess?: boolean;
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) allowedOrganizationIds?: string[];
  @IsOptional() @IsUUID() departmentGroupId?: string;
}

export class UpdatePermissionsDto {
  @IsArray()
  @IsEnum(PermissionKey, { each: true })
  permissionKeys!: PermissionKey[];
}
