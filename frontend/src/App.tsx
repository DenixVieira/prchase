import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { PageLoader } from "@/components/shared/PageLoader";
import router from "./routes/router";

export default function App() {
  // Rede de segurança para rotas sem layout próprio (ex.: NotFoundPage), já
  // que os layouts (Auth/App) cuidam do Suspense das páginas que envolvem.
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
