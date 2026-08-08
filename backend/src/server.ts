import "reflect-metadata";
import http from "http";
import { createApp } from "./app";
import { AppDataSource } from "./config/data-source";
import { initSocket } from "./sockets/socket";
import { logger } from "./config/logger";
import { env } from "./config/env";
import { auditService } from "./modules/audit/audit.service";
import { notificationService } from "./modules/notifications/notification.service";

const RETENTION_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Roda a purga de logs de auditoria (3 meses) e de notificações (1 mês) uma
 * vez no boot e, depois, a cada 24h — mantém a retenção sem depender de um
 * cron externo ou de acesso ao host (útil tanto em Windows quanto em Linux,
 * já que roda dentro do próprio processo Node do container).
 */
function scheduleRetentionPurges(): void {
  const runPurges = () => {
    auditService.purgeExpiredLogs().catch((error) => logger.error({ error }, "Falha ao purgar logs de auditoria expirados"));
    notificationService.purgeExpiredNotifications().catch((error) => logger.error({ error }, "Falha ao purgar notificações expiradas"));
  };
  runPurges();
  setInterval(runPurges, RETENTION_CHECK_INTERVAL_MS);
}

const DB_CONNECT_MAX_RETRIES = 20;
const DB_CONNECT_RETRY_DELAY_MS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tenta conectar ao PostgreSQL com novas tentativas e espera entre elas.
 * Evita que o container entre em crash-loop nos primeiros segundos de vida
 * do banco (ex.: Postgres reinicia internamente após o initdb no primeiro
 * boot, ou a rede do Docker ainda não propagou o DNS do serviço "postgres").
 */
async function connectWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= DB_CONNECT_MAX_RETRIES; attempt++) {
    try {
      await AppDataSource.initialize();
      logger.info("Conexão com o PostgreSQL estabelecida");
      return;
    } catch (error) {
      const isLastAttempt = attempt === DB_CONNECT_MAX_RETRIES;
      logger.warn(
        { attempt, maxRetries: DB_CONNECT_MAX_RETRIES, error: error instanceof Error ? error.message : error },
        `Não foi possível conectar ao PostgreSQL (tentativa ${attempt}/${DB_CONNECT_MAX_RETRIES}).`
      );
      if (isLastAttempt) {
        throw error;
      }
      await delay(DB_CONNECT_RETRY_DELAY_MS);
    }
  }
}

async function bootstrap() {
  try {
    await connectWithRetry();

    const app = createApp();
    const httpServer = http.createServer(app);
    initSocket(httpServer);
    scheduleRetentionPurges();

    httpServer.listen(env.port, () => {
      logger.info(`API disponível em http://localhost:${env.port}/api`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Recebido ${signal}. Encerrando servidor...`);
      httpServer.close(() => logger.info("Servidor HTTP encerrado"));
      await AppDataSource.destroy();
      process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({ error }, "Falha ao iniciar a aplicação após todas as tentativas de conexão com o banco");
    process.exit(1);
  }
}

bootstrap();
