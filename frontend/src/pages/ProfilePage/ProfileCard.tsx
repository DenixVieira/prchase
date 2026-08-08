import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user?.name}</CardTitle>
        <CardDescription>{user?.email} — {user?.department?.name ?? "Sem departamento"}</CardDescription>
      </CardHeader>
    </Card>
  );
}
