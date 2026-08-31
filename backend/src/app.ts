import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import departmentsRoutes from "./modules/departments/departments.routes";
import organizationsRoutes from "./modules/organizations/organizations.routes";
import purchaseRequestsRoutes from "./modules/purchase-requests/purchase-requests.routes";
import ticketsRoutes from "./modules/tickets/tickets.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import auditRoutes from "./modules/audit/audit.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import tagsRoutes from "./modules/tags/tags.routes";
import devicesRoutes from "./modules/devices/devices.routes";
import departmentGroupsRoutes from "./modules/department-groups/department-groups.routes";
import requestTypesRoutes from "./modules/request-types/request-types.routes";
import requestSubmissionsRoutes from "./modules/request-submissions/request-submissions.routes";
import boardsRoutes from "./modules/boards/boards.routes";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  // Comprime respostas compressíveis (JSON, HTML, JS, CSS) — o filtro padrão
  // já ignora tipos pouco compressíveis (imagens, PDFs em /uploads), então
  // não há downside em ligar globalmente.
  app.use(compression());
  app.use(
    cors({
      // Requisições same-origin (ex.: frontend servido pelo mesmo Nginx da API)
      // não enviam Origin ou são naturalmente permitidas pelo navegador; aqui só
      // precisamos validar chamadas de fato cross-origin contra a lista configurada.
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use("/api", apiRateLimiter);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), env.uploadsDir), { maxAge: "7d", etag: true })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/departments", departmentsRoutes);
  app.use("/api/organizations", organizationsRoutes);
  app.use("/api/purchase-requests", purchaseRequestsRoutes);
  app.use("/api/tickets", ticketsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/tags", tagsRoutes);
  app.use("/api/devices", devicesRoutes);
  app.use("/api/department-groups", departmentGroupsRoutes);
  app.use("/api/request-types", requestTypesRoutes);
  app.use("/api/request-submissions", requestSubmissionsRoutes);
  app.use("/api/boards", boardsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
