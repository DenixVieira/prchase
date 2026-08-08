import { IsString, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class CreateOrganizationDto {
  @IsString() @MaxLength(150) name!: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateOrganizationDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
