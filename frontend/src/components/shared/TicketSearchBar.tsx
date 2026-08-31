import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { BoardColumnBadge } from "@/components/shared/StatusBadge";
import { ticketsService } from "@/services/tickets.service";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Busca rápida de tickets por protocolo ou título, disponível globalmente no
 * Navbar. O backend já filtra pra só devolver tickets que o usuário tem
 * acesso (mesmo departamento, solicitante, responsável, ou irrestrito) —
 * aqui só cuida de exibir e navegar para o resultado escolhido.
 */
export function TicketSearchBar() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedTerm = useDebounce(term, 300);
  const query = debouncedTerm.trim();

  const { data: results, isFetching } = useQuery({
    queryKey: ["tickets", "quick-search", query],
    queryFn: () => ticketsService.quickSearch(query),
    enabled: query.length >= 2,
  });

  // Fecha o dropdown ao clicar fora ou apertar Esc.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (ticketId: string) => {
    setIsOpen(false);
    setTerm("");
    navigate(`/tickets/${ticketId}`);
  };

  const showDropdown = isOpen && query.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => { setTerm(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar ticket por protocolo ou título..."
        className="h-9 pl-8 pr-8"
      />
      {term && (
        <button
          type="button"
          aria-label="Limpar busca"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => { setTerm(""); setIsOpen(false); }}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {isFetching && (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">Buscando...</p>
          )}
          {!isFetching && (results ?? []).length === 0 && (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">Nenhum ticket encontrado.</p>
          )}
          {!isFetching && (results ?? []).map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => handleSelect(ticket.id)}
              className="flex w-full flex-col gap-1 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{ticket.protocol}</span>
                <BoardColumnBadge column={ticket.column} />
              </div>
              <span className="truncate text-sm font-medium">{ticket.title}</span>
              <span className="truncate text-xs text-muted-foreground">{ticket.department?.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
