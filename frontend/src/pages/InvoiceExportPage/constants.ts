import { todayDateString } from "@/lib/utils";
import { Attachment } from "@/types";

export const MAX_RANGE_DAYS = 30;

export function isOverdue(attachment: Attachment): boolean {
  return !!attachment.dueDate && attachment.dueDate < todayDateString();
}
