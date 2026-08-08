import { IsString, IsUUID, IsOptional, IsDateString, MaxLength, MinLength } from "class-validator";

export class CreateDeviceDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsString() @MinLength(1) @MaxLength(120) serialNumber!: string;
  @IsOptional() @IsString() @MaxLength(40) mac?: string;
  @IsString() @MinLength(1) @MaxLength(120) model!: string;
  @IsString() @MinLength(1) @MaxLength(120) brand!: string;
  @IsDateString() purchaseDate!: string;
  @IsDateString() warrantyExpiration!: string;
  @IsUUID() organizationId!: string;
  @IsUUID() departmentId!: string;
  @IsOptional() @IsString() @MaxLength(150) assignedToName?: string;
}

export class UpdateDeviceDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(40) mac?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) model?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) brand?: string;
  @IsOptional() @IsDateString() purchaseDate?: string;
  @IsOptional() @IsDateString() warrantyExpiration?: string;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() @MaxLength(150) assignedToName?: string;
}

export class CreateMaintenanceDto {
  @IsDateString() sentDate!: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsString() @MinLength(1) reason!: string;
}
