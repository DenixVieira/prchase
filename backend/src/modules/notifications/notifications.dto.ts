import { IsEnum, IsArray } from "class-validator";
import { NotificationPreference, NotificationType } from "../../database/entities";

export class UpdateNotificationPreferenceDto {
  @IsEnum(NotificationPreference)
  preference!: NotificationPreference;
}

export class UpdateMutedTypesDto {
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  mutedTypes!: NotificationType[];
}
