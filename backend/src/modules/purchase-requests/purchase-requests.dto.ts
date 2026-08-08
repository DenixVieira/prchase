import { IsString, IsEnum, IsNumber, Min, IsOptional, MinLength, MaxLength, IsUUID } from "class-validator";
import { Priority } from "../../database/entities";

export class CreatePurchaseRequestDto {
  // O departamento é sempre o do usuário autenticado (definido no backend,
  // nunca aceito do cliente) — por isso não aparece aqui.

  // A organização é escolhida manualmente pelo usuário entre as que seu
  // departamento pode acessar; a validação de acesso acontece no service.
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MaxLength(100)
  costCenter!: string;

  @IsString()
  @MaxLength(150)
  supplier!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsString()
  @MinLength(5)
  justification!: string;

  @IsNumber()
  @Min(0.01)
  estimatedValue!: number;

  @IsEnum(Priority)
  priority!: Priority;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdatePurchaseRequestDto {
  @IsOptional() @IsString() @MaxLength(100) costCenter?: string;
  @IsOptional() @IsString() @MaxLength(150) supplier?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MinLength(5) description?: string;
  @IsOptional() @IsString() @MinLength(5) justification?: string;
  @IsOptional() @IsNumber() @Min(0.01) estimatedValue?: number;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() observations?: string;
}

export class RejectPurchaseRequestDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

export class ApprovePurchaseRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
