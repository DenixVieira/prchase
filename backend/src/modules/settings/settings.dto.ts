import { IsString, IsInt, IsBoolean, IsEmail, MinLength } from "class-validator";

export class UpdateSmtpSettingsDto {
  @IsString() @MinLength(3) host!: string;
  @IsInt() port!: number;
  @IsBoolean() secure!: boolean;
  @IsString() user!: string;
  @IsString() password!: string;
  @IsEmail() fromEmail!: string;
  @IsString() @MinLength(2) fromName!: string;
}
