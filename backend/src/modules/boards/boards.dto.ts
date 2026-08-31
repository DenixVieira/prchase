import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsHexColor, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested, ArrayMinSize, ArrayMaxSize } from "class-validator";

export class BoardColumnDto {
  /** Presente = atualiza a coluna existente (precisa pertencer a este board); ausente = cria uma nova. */
  @IsOptional() @IsUUID() id?: string;
  @IsString() @MaxLength(60) name!: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsBoolean() isInitial?: boolean;
  @IsOptional() @IsBoolean() isDone?: boolean;
  @IsOptional() @IsBoolean() isCancelled?: boolean;
}

export class ReplaceBoardColumnsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => BoardColumnDto)
  columns!: BoardColumnDto[];
}
