import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const ctx = req.uploadContext;
    if (!ctx) {
      return callback(new Error("Contexto de upload não resolvido"), "");
    }
    const dir = path.join(process.cwd(), env.uploadsDir, "anexos tickets", ctx.year, ctx.month, ctx.protocol);
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
    callback(null, `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

export const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return callback(ApiError.badRequest(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
  callback(null, true);
};

/** Nome físico + extensão seguros a partir do nome original — mesma convenção usada por todo upload de anexo do sistema. */
export function buildSafeAttachmentFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}${ext}`;
}

export const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter,
});

// Armazenamento da nota fiscal: diretório próprio notas/<organização>/<data>,
// resolvido em resolveTicketInvoiceUploadContext — fora da estrutura padrão
// de anexos (ano/mês/protocolo) usada acima. O arquivo em si ("Notaanexada")
// é nomeado por categoria/valor da solicitação, não a pasta.
const invoiceStorage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const ctx = req.invoiceUploadContext;
    if (!ctx) {
      return callback(new Error("Contexto de upload de nota fiscal não resolvido"), "");
    }
    const dir = path.join(process.cwd(), env.uploadsDir, "notas", ctx.organizationName, ctx.year, ctx.month, ctx.day);
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

export const uploadInvoice = multer({
  storage: invoiceStorage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter,
});

// Anexos de equipamento (fotos do aparelho/caixa etc.): diretório próprio
// Equipamentos/<organização>/<departamento>/<número de série>/, resolvido em
// resolveDeviceUploadContext.
const deviceStorage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const ctx = req.deviceUploadContext;
    if (!ctx) {
      return callback(new Error("Contexto de upload de equipamento não resolvido"), "");
    }
    const dir = path.join(process.cwd(), env.uploadsDir, "Equipamentos", ctx.organizationName, ctx.departmentName, ctx.serialNumber);
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

export const uploadDevice = multer({
  storage: deviceStorage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter,
});
