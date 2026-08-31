import { z } from "zod";
import { RequestField, RequestFieldType } from "@/types";

/**
 * Monta em runtime o schema zod de um formulário dinâmico a partir dos
 * RequestField cadastrados pelo admin — não dá pra tipar isso estaticamente
 * como os demais formulários do sistema, já que os campos só são conhecidos
 * em tempo de execução.
 */
export function buildDynamicSchema(fields: RequestField[]): z.AnyZodObject {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.key] = buildFieldSchema(field);
  }

  return z.object(shape);
}

function buildFieldSchema(field: RequestField): z.ZodTypeAny {
  const required = field.required;

  switch (field.type) {
    case RequestFieldType.TEXT:
    case RequestFieldType.TEXTAREA: {
      const base = z.string();
      return required ? base.min(1, `Informe ${labelLower(field.label)}`) : base.optional().or(z.literal(""));
    }
    case RequestFieldType.NUMBER: {
      const base = z.coerce.number({ invalid_type_error: `${field.label} deve ser numérico` });
      return required ? base : base.optional();
    }
    case RequestFieldType.DATE:
    case RequestFieldType.DATETIME: {
      const base = z.string().refine((v) => !Number.isNaN(Date.parse(v)), `Informe uma data válida para ${labelLower(field.label)}`);
      return required ? base : z.string().optional().or(z.literal(""));
    }
    case RequestFieldType.CHECKBOX: {
      const base = z.boolean().default(false);
      return required ? base.refine((v) => v === true, `É preciso marcar "${field.label}"`) : base;
    }
    case RequestFieldType.SELECT: {
      const values = (field.options ?? []).map((o) => o.value);
      const base = values.length > 0 ? z.enum(values as [string, ...string[]]) : z.string();
      return required ? base : base.optional().or(z.literal(""));
    }
    case RequestFieldType.MULTISELECT: {
      const base = z.array(z.string());
      return required ? base.min(1, `Selecione ao menos uma opção em "${field.label}"`) : base.optional();
    }
    case RequestFieldType.FILE: {
      const base = z.custom<File | undefined>((v) => v === undefined || v instanceof File, `Anexe um arquivo válido para "${field.label}"`);
      return required
        ? base.refine((v) => v instanceof File, `O anexo "${field.label}" é obrigatório`)
        : base;
    }
    default:
      return z.unknown();
  }
}

function labelLower(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** Separa o objeto de valores em (dataParaJson, arquivosPorKey) pra envio via requestSubmissionsService.create. */
export function splitDynamicFormData(fields: RequestField[], values: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const files: Record<string, File> = {};

  for (const field of fields) {
    const value = values[field.key];
    if (field.type === RequestFieldType.FILE) {
      if (value instanceof File) files[field.key] = value;
      continue;
    }
    if (value === undefined || value === "") continue;
    data[field.key] = value;
  }

  return { data, files };
}
