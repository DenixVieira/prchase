import { Request } from "express";
import { LessThan } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { AuditLog, AuditAction } from "../../database/entities";
import { logger } from "../../config/logger";

/** Retenção dos logs de auditoria: 3 meses. Registros mais antigos são
 * purgados automaticamente (ver purgeExpiredLogs, chamado no bootstrap do
 * servidor e periodicamente a cada 24h). */
const AUDIT_LOG_RETENTION_MONTHS = 3;

export class AuditService {
  private repo = AppDataSource.getRepository(AuditLog);

  private extractIp(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    return req.socket.remoteAddress ?? null;
  }

  /**
   * Remove logs de auditoria mais antigos que AUDIT_LOG_RETENTION_MONTHS
   * (3 meses). Executado no boot do servidor e depois a cada 24h
   * (ver server.ts), garantindo que os logs tenham "tempo de vida" limitado
   * sem depender de um job externo.
   */
  async purgeExpiredLogs(): Promise<number> {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - AUDIT_LOG_RETENTION_MONTHS);

    const result = await this.repo.delete({ createdAt: LessThan(threshold) });
    const removed = result.affected ?? 0;
    if (removed > 0) {
      logger.info({ removed, threshold }, `Retenção de auditoria: ${removed} log(s) com mais de ${AUDIT_LOG_RETENTION_MONTHS} meses removidos.`);
    }
    return removed;
  }

  async log(params: {
    userId?: string | null;
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
    req?: Request;
  }): Promise<void> {
    await this.repo.save(
      this.repo.create({
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        ipAddress: this.extractIp(params.req),
        metadata: params.metadata ?? null,
      })
    );
  }
}

export const auditService = new AuditService();
