import { lazy, Suspense, LazyExoticComponent, ComponentType } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { FileText, LucideProps } from "lucide-react";

type IconName = keyof typeof dynamicIconImports;

// Cache por nome: `lazy()` precisa ser chamado uma única vez por componente,
// não a cada render (senão o React remonta o ícone do zero toda hora).
const iconCache = new Map<string, LazyExoticComponent<ComponentType<LucideProps>>>();

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Ícone lucide-react carregado sob demanda a partir de um nome salvo em
 * RequestType.icon (ex.: "Wrench", "ShoppingCart") — evita empacotar a
 * biblioteca inteira de ícones num chunk só (import * as Icons from
 * "lucide-react" chegava a ~740kB). Cai no ícone padrão (FileText) enquanto
 * carrega ou quando o nome não existe/está em branco.
 */
export function DynamicIcon({ name, ...props }: { name?: string | null } & Omit<LucideProps, "name">) {
  const kebab = name ? (toKebabCase(name) as IconName) : undefined;
  const importFn = kebab ? dynamicIconImports[kebab] : undefined;
  if (!importFn) return <FileText {...props} />;

  if (!iconCache.has(kebab as string)) {
    iconCache.set(kebab as string, lazy(importFn));
  }
  const LazyIcon = iconCache.get(kebab as string)!;

  return (
    <Suspense fallback={<FileText {...props} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
}
