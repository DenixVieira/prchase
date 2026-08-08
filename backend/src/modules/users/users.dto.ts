import { IsString, IsEmail, IsUUID, IsOptional, IsBoolean, Matches, MinLength, MaxLength, IsEnum } from "class-validator";
import { NotificationPreference } from "../../database/entities";

// Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter no mínimo 8 caracteres e incluir maiúscula, minúscula, número e símbolo";

export class CreateUserDto {
  @IsString() @MaxLength(150) name!: string;
  @IsString() @MinLength(3) @MaxLength(100) login!: string;
  @IsEmail() email!: string;
  @IsString() @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE }) password!: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsBoolean() isAdmin?: boolean;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsBoolean() isAdmin?: boolean;
  @IsOptional() @IsEnum(NotificationPreference) notificationPreference?: NotificationPreference;
}

export class ResetPasswordDto {
  @IsString() @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE }) newPassword!: string;
}

export class ChangeDepartmentDto {
  @IsUUID() departmentId!: string;
}
