import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsService } from "@/services/notifications.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { NotificationType } from "@/types";
import { NOTIFICATION_TYPE_LABELS } from "./constants";

export function NotificationTypesCard() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [mutedTypes, setMutedTypes] = useState<NotificationType[]>(user?.mutedNotificationTypes ?? []);

  const handleToggleType = async (type: NotificationType, enabled: boolean) => {
    const next = enabled ? mutedTypes.filter((t) => t !== type) : [...mutedTypes, type];
    setMutedTypes(next);
    try {
      await notificationsService.updateMutedTypes(next);
      await refreshUser();
    } catch (error) {
      setMutedTypes(mutedTypes);
      showToast({ title: "Erro ao atualizar tipos de notificação", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipos de Notificação</CardTitle>
        <CardDescription>Escolha quais eventos você quer ser notificado (por e-mail e/ou internamente, conforme a preferência acima).</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.values(NotificationType).map((type) => {
          const enabled = !mutedTypes.includes(type);
          return (
            <label key={type} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
              <Checkbox checked={enabled} onCheckedChange={(value) => handleToggleType(type, !!value)} />
              {NOTIFICATION_TYPE_LABELS[type]}
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
