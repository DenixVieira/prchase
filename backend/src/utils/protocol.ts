import { DataSource } from "typeorm";

/**
 * Gera um número sequencial no formato PREFIXO-000123, baseado na contagem
 * total de registros da entidade informada (incluindo os soft-deleted, para
 * nunca reutilizar um número já emitido).
 */
export async function generateSequentialNumber(
  dataSource: DataSource,
  tableName: string,
  prefix: string
): Promise<string> {
  const result = await dataSource.query(
    `SELECT COUNT(*)::int AS count FROM "${tableName}"`
  );
  const nextSequence = (result[0]?.count ?? 0) + 1;
  return `${prefix}-${String(nextSequence).padStart(6, "0")}`;
}
