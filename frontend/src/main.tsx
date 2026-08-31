import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ToastProvider } from "./components/ui/toast";
import "./styles/globals.css";

// Todas as rotas são carregadas sob demanda (lazy/code-split, ver router.tsx)
// pelo nome do arquivo com hash — a cada novo deploy os hashes mudam e os
// arquivos antigos somem do servidor. Uma aba que já estava aberta antes do
// deploy, ao navegar para uma rota ainda não carregada nesta sessão, tenta
// buscar o arquivo antigo (que não existe mais) e cai na tela genérica
// "Unexpected Application Error!" do React Router. O Vite dispara esse
// evento nesse cenário específico — em vez de mostrar o erro, recarrega a
// página uma vez (o novo index.html já aponta pros hashes certos).
const PRELOAD_ERROR_GUARD_KEY = "psc:reloaded-after-preload-error";

window.addEventListener("vite:preloadError", () => {
  // Guard evita loop infinito de reload se o problema não for um deploy
  // (ex.: backend/CDN fora do ar) — só tenta recarregar uma vez seguida.
  if (sessionStorage.getItem(PRELOAD_ERROR_GUARD_KEY)) return;
  sessionStorage.setItem(PRELOAD_ERROR_GUARD_KEY, "1");
  window.location.reload();
});

// Se a aplicação ficou de pé por alguns segundos sem um novo preloadError,
// a recarga funcionou — libera o guard pra um PRÓXIMO deploy (mais tarde,
// na mesma aba) também poder se autorrecuperar, em vez de ficar bloqueado
// pra sempre pelo guard de uma única recarga anterior bem-sucedida.
window.setTimeout(() => sessionStorage.removeItem(PRELOAD_ERROR_GUARD_KEY), 5000);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
