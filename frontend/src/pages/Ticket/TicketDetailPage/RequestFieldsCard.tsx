import { ReactNode } from "react";
import { Eye, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/utils";
import { Attachment, RequestField, RequestFieldType, Ticket } from "@/types";

interface RequestFieldsCardProps {
  ticket: Ticket;
  onPreview: (attachment: Attachment) => void;
}

/** Só renderiza quando o ticket nasceu de um tipo de solicitação dinâmico (não-Compra). */
export function RequestFieldsCard({ ticket, onPreview }: RequestFieldsCardProps) {
  const submission = ticket.requestSubmission;
  if (!submission) return null;

  const fields = [...(submission.requestType?.fields ?? ticket.requestType?.fields ?? [])].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Campos da Solicitação</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && <p className="text-sm text-muted-foreground">Nenhum campo cadastrado neste tipo.</p>}
        {fields.map((field) => (
          <FieldValue key={field.id} field={field} value={submission.data?.[field.key]} attachments={ticket.attachments} onPreview={onPreview} />
        ))}
      </CardContent>
    </Card>
  );
}

function FieldValue({
  field, value, attachments, onPreview,
}: {
  field: RequestField;
  value: unknown;
  attachments?: Attachment[];
  onPreview: (attachment: Attachment) => void;
}) {
  let content: ReactNode = "—";

  switch (field.type) {
    case RequestFieldType.DATE:
      content = typeof value === "string" && value ? formatDateOnly(value) : "—";
      break;
    case RequestFieldType.CHECKBOX:
      content = value ? "Sim" : "Não";
      break;
    case RequestFieldType.MULTISELECT: {
      const values = Array.isArray(value) ? (value as string[]) : [];
      const labels = values.map((v) => field.options?.find((o) => o.value === v)?.label ?? v);
      content = labels.length > 0 ? labels.join(", ") : "—";
      break;
    }
    case RequestFieldType.SELECT: {
      const optionLabel = field.options?.find((o) => o.value === value)?.label;
      content = optionLabel ?? (typeof value === "string" && value ? value : "—");
      break;
    }
    case RequestFieldType.FILE: {
      const attachment = (attachments ?? []).find((a) => a.sourceFieldKey === field.key);
      content = attachment ? (
        <button
          type="button"
          onClick={() => onPreview(attachment)}
          className="flex items-center gap-1.5 text-primary hover:underline"
        >
          <Paperclip className="h-3.5 w-3.5" /> {attachment.originalName} <Eye className="h-3.5 w-3.5" />
        </button>
      ) : "—";
      break;
    }
    default:
      content = typeof value === "string" || typeof value === "number" ? String(value) : "—";
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">{field.label}</p>
      <p className="text-sm font-medium">{content}</p>
    </div>
  );
}
