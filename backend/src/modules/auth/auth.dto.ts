import { IsEmail, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

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

export class ChangeAvatarDto {
  // null = remover a foto atual. String = nova foto — o front já manda
  // redimensionada/comprimida; aqui só confere que é mesmo uma imagem
  // pequena em data URL, não confia soltar qualquer string do cliente.
  @ValidateIf((o) => o.avatarDataUrl !== null)
  @IsString()
  @MaxLength(300_000, { message: "Imagem muito grande" })
  @Matches(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/, { message: "Formato de imagem inválido" })
  avatarDataUrl!: string | null;
}
