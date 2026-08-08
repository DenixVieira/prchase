import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { PageLoader } from "@/components/shared/PageLoader";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">Sistema de Gestão de Compras</h1>
          <p className="text-sm text-muted-foreground">Solicitações, aprovações e tickets de compras</p>
        </div>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
