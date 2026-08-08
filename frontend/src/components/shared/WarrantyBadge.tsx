import { Badge } from "@/components/ui/badge";
import { addDaysToDateString, todayDateString } from "@/lib/utils";

const EXPIRING_SOON_DAYS = 30;

export function WarrantyBadge({ warrantyExpiration }: { warrantyExpiration: string }) {
  const today = todayDateString();
  if (warrantyExpiration < today) {
    return <Badge variant="destructive">Garantia expirada</Badge>;
  }
  if (warrantyExpiration <= addDaysToDateString(today, EXPIRING_SOON_DAYS)) {
    return <Badge variant="warning">Garantia expirando</Badge>;
  }
  return <Badge variant="success">Na garantia</Badge>;
}
