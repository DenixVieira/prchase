import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface UserNameTagProps {
  user?: Pick<User, "name" | "department"> | null;
  className?: string;
  tagClassName?: string;
}

// Nome do usuário com uma tag discreta do departamento ao lado, usada em
// todo lugar que exibe "quem" fez algo (solicitante, autor de comentário,
// responsável, acompanhante) para dar contexto sem chamar muita atenção.
export function UserNameTag({ user, className, tagClassName }: UserNameTagProps) {
  if (!user) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{user.name}</span>
      {user.department?.name && (
        <span className={cn("rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground", tagClassName)}>
          {user.department.name}
        </span>
      )}
    </span>
  );
}
