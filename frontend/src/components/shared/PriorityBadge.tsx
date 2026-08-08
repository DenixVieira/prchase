import { Badge } from "@/components/ui/badge";
import { Priority } from "@/types";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]: { label: "Baixa", className: "border-transparent bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  [Priority.MEDIUM]: { label: "Média", className: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
  [Priority.HIGH]: { label: "Alta", className: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200" },
  [Priority.URGENT]: { label: "Urgente", className: "border-transparent bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return <Badge className={cn(config.className)}>{config.label}</Badge>;
}
