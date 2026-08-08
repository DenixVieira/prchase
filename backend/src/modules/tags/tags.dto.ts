import { IsString, IsOptional, MinLength, MaxLength, Matches } from "class-validator";

export class CreateTagDto {
  @IsString() @MinLength(1) @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "Cor deve ser um hexadecimal no formato #RRGGBB" })
  color?: string;
}

export class UpdateTagDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "Cor deve ser um hexadecimal no formato #RRGGBB" })
  color?: string;
}
