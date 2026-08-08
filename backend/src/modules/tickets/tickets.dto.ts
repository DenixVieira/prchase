import { IsString, IsUUID, IsEnum, IsOptional, MinLength, MaxLength } from "class-validator";
import { TicketStatus, Priority } from "../../database/entities";

export class UpdateTicketDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(3) description?: string;
}

export class MoveTicketDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}

export class AssignTicketDto {
  @IsUUID()
  assigneeId!: string;
}

export class ChangePriorityDto {
  @IsEnum(Priority)
  priority!: Priority;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

export class AddFollowerDto {
  @IsUUID()
  userId!: string;
}

export class AddTagDto {
  @IsUUID()
  tagId!: string;
}
