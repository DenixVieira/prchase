import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.BACKEND_PORT || "3333", 10),
  // Lista de origens permitidas ("*" libera qualquer origem). Suporta múltiplas
  // origens separadas por vírgula (ex.: "http://localhost:8080,https://compras.empresa.com").
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  // URL pública usada para montar links absolutos em e-mails (o link interno
  // do sino de notificações continua relativo, resolvido pelo próprio front).
  // Trocar aqui quando o endereço de acesso mudar (novo IP, domínio, etc.).
  appUrl: (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, ""),
  uploadMaxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB || "20", 10),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "600", 10),
  },
  db: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "purchase_system",
    username: process.env.POSTGRES_USER || "purchase_admin",
    password: process.env.POSTGRES_PASSWORD || "change_me",
  },
  jwt: {
    secret: required("JWT_SECRET", "dev_only_insecure_secret_change_me_32ch"),
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_only_insecure_refresh_secret_32ch"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  smtpDefaults: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "no-reply@empresa.com",
    fromName: process.env.SMTP_FROM_NAME || "Sistema de Compras",
  },
  uploadsDir: process.env.UPLOADS_DIR || "uploads",
};
