import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link to="/dashboard"><Button>Voltar ao Dashboard</Button></Link>
    </div>
  );
}
