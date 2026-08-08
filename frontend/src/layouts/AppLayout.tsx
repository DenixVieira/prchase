import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { PageLoader } from "@/components/shared/PageLoader";
import { useSocketEvents } from "@/hooks/useSocketEvents";

export function AppLayout() {
  useSocketEvents();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu automaticamente ao navegar (ex.: usuário tocou num link e a
  // troca de rota já indica que ele terminou de usar o menu).
  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
