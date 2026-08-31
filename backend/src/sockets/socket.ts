import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { logger } from "../config/logger";

let io: SocketIOServer | null = null;

interface AccessTokenPayload {
  sub: string;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== "string") {
        return next(new Error("Token de autenticação ausente"));
      }
      const payload = jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Token de autenticação inválido"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug({ userId, socketId: socket.id }, "Cliente conectado via Socket.io");

    socket.on("disconnect", () => {
      logger.debug({ userId, socketId: socket.id }, "Cliente desconectado");
    });
  });

  logger.info("Socket.io inicializado");
  return io;
}

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: "notification:new",
  TICKET_UPDATED: "ticket:updated",
  TICKET_CREATED: "ticket:created",
  TICKET_MOVED: "ticket:moved",
  TICKET_COMMENTED: "ticket:commented",
  PURCHASE_REQUEST_UPDATED: "purchase-request:updated",
} as const;

export function emitToUser(userId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitBroadcast(event: string, payload: unknown) {
  if (!io) return;
  io.emit(event, payload);
}
