import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from "class-validator";

export class CreateDepartmentGroupDto {
  @IsString() @MinLength(1) @MaxLength(150) name!: string;
  @IsOptional() @IsUUID() organizationId?: string;
}

export class UpdateDepartmentGroupDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) name?: string;
  @IsOptional() @IsUUID() organizationId?: string;
}
