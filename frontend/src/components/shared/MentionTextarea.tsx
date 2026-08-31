import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { usersService } from "@/services/users.service";
import { useDebounce } from "@/hooks/useDebounce";
import { initials } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Textarea com autocomplete de menção: digitar "@" seguido de texto (sem
 * espaço) abre um dropdown com usuários que casam com a busca. Escolher um
 * insere "@Nome " (texto puro, sem ID embutido — de propósito: fica limpo
 * tanto na caixa de digitação quanto no comentário salvo, ao custo de o
 * backend resolver quem foi mencionado por casamento de nome, não por ID —
 * ver extractMentionedUserIds em backend/src/utils/mentions.ts). O mesmo
 * nome é realçado como chip na exibição por <MentionText>.
 */
export function MentionTextarea({ value, onChange, placeholder, rows = 2, className }: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // null = dropdown fechado; string (mesmo vazia) = aberto, com o texto digitado após o "@".
  const [query, setQuery] = useState<string | null>(null);
  const [triggerStart, setTriggerStart] = useState(0);
  const debouncedQuery = useDebounce(query ?? "", 200);

  const { data: results } = useQuery({
    queryKey: ["users", "mention", debouncedQuery],
    queryFn: () => usersService.search({ search: debouncedQuery, limit: 6 }),
    enabled: query !== null,
  });

  const detectTrigger = (text: string, cursor: number) => {
    // "@" mais próximo antes do cursor, sem espaço/quebra de linha entre eles
    // — assim "fulano@empresa.com" ou "@" seguido de espaço não disparam o dropdown.
    const match = text.slice(0, cursor).match(/@([^\s@]*)$/);
    if (match) {
      setTriggerStart(cursor - match[0].length);
      setQuery(match[1]);
    } else {
      setQuery(null);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    detectTrigger(e.target.value, e.target.selectionStart ?? e.target.value.length);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && query !== null) setQuery(null);
  };

  const handleSelect = (user: { id: string; name: string }) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const token = `@${user.name} `;
    const nextValue = value.slice(0, triggerStart) + token + value.slice(cursor);
    onChange(nextValue);
    setQuery(null);
    // Precisa do próximo tick: o value só é refletido no DOM depois do
    // re-render disparado por onChange acima.
    requestAnimationFrame(() => {
      const pos = triggerStart + token.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const showDropdown = query !== null && (results ?? []).length > 0;

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 bottom-full z-50 mb-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {(results ?? []).map((u) => (
            <button
              key={u.id}
              type="button"
              // onMouseDown (não onClick) + preventDefault: clicar no item não
              // pode tirar o foco da textarea antes do handler rodar, senão
              // selectionStart já teria zerado quando handleSelect ler o cursor.
              onMouseDown={(e) => { e.preventDefault(); handleSelect(u); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={u.avatarDataUrl ?? undefined} alt={u.name} />
                <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{u.name}</span>
              {u.department && <span className="text-xs text-muted-foreground truncate">{u.department.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
