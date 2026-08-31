import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { initials } from "@/lib/utils";
import { resizeImageToDataUrl } from "@/lib/resizeImage";

const MAX_SOURCE_FILE_MB = 8;

export function ProfileCard() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast({ title: "Selecione um arquivo de imagem", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SOURCE_FILE_MB * 1024 * 1024) {
      showToast({ title: `Imagem muito grande (máx. ${MAX_SOURCE_FILE_MB}MB)`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await authService.changeAvatar(dataUrl);
      await refreshUser();
      showToast({ title: "Foto de perfil atualizada", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao atualizar foto", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await authService.changeAvatar(null);
      await refreshUser();
      showToast({ title: "Foto de perfil removida", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao remover foto", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={user?.avatarDataUrl ?? undefined} alt={user?.name} />
          <AvatarFallback className="text-lg">{user ? initials(user.name) : "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <CardTitle>{user?.name}</CardTitle>
          <CardDescription>{user?.email} — {user?.department?.name ?? "Sem departamento"}</CardDescription>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" isLoading={isSaving} onClick={() => inputRef.current?.click()}>
              <Camera className="h-3.5 w-3.5" /> Trocar foto
            </Button>
            {user?.avatarDataUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={isSaving}>
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
