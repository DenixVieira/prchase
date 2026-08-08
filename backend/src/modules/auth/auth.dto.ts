import { IsEmail, IsString, Matches, MinLength } from "class-validator";

// Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter no mínimo 8 caracteres e incluir maiúscula, minúscula, número e símbolo";

export class LoginDto {
  @IsString()
  @MinLength(3)
  login!: string;

  @IsString()
  @MinLength(3)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  newPassword!: string;
}

export class ChangeEmailDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsEmail()
  newEmail!: string;
}
