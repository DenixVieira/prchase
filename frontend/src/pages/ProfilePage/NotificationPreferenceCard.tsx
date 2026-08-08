import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsService } from "@/services/notifications.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { NotificationPreference } from "@/types";
import { PREFERENCE_LABELS } from "./constants";

export function NotificationPreferenceCard() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const handlePreferenceChange = async (preference: string) => {
    try {
      await notificationsService.updatePreference(preference);
      await refreshUser();
      showToast({ title: "Preferência atualizada", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao atualizar preferência", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Preferência de Notificações</CardTitle></CardHeader>
      <CardContent>
        <Select defaultValue={user?.notificationPreference} onValueChange={handlePreferenceChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.values(NotificationPreference).map((p) => <SelectItem key={p} value={p}>{PREFERENCE_LABELS[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
