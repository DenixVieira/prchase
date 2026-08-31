import { Fragment, ReactNode, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export interface MentionCandidate {
  id: string;
  name: string;
  avatarDataUrl?: string | null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface MentionTextProps {
  text: string;
  /** Usuários "mencionáveis" (ver CommentsCard) — só "@Nome" que casa com um
   * destes vira chip com preview de foto; qualquer outro "@algumacoisa" fica texto normal. */
  candidates: MentionCandidate[];
}

/** Realça "@Nome" no texto — mesma convenção de texto puro inserida pelo MentionTextarea. */
export function MentionText({ text, candidates }: MentionTextProps) {
  if (candidates.length === 0 || !text.includes("@")) return <>{text}</>;

  const byName = new Map(candidates.map((c) => [c.name, c]));
  // Nome mais longo primeiro, pra "@Ana Paula" não virar só o chip de "Ana"
  // quando as duas existirem.
  const sortedNames = [...byName.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])@(${sortedNames.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "gu"
  );

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(<Fragment key={key++}>{text.slice(lastIndex, index)}</Fragment>);
    const candidate = byName.get(match[1]);
    parts.push(candidate ? <MentionChip key={key++} candidate={candidate} /> : <Fragment key={key++}>{match[0]}</Fragment>);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);

  return <>{parts}</>;
}

/** Chip da menção — passar o mouse por cima mostra a foto de perfil da pessoa. */
function MentionChip({ candidate }: { candidate: MentionCandidate }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span className="relative inline-block" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className="cursor-default rounded bg-primary/10 px-1 font-medium text-primary">@{candidate.name}</span>
      {hovered && (
        <span className="absolute bottom-full left-0 z-50 mb-1 flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1.5 text-popover-foreground shadow-md">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={candidate.avatarDataUrl ?? undefined} alt={candidate.name} />
            <AvatarFallback className="text-[10px]">{initials(candidate.name)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{candidate.name}</span>
        </span>
      )}
    </span>
  );
}
