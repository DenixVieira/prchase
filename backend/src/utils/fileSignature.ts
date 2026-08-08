import fs from "fs";

type SignatureCheck = (buffer: Buffer) => boolean;

const startsWith = (bytes: number[]): SignatureCheck => (buffer) =>
  bytes.every((byte, i) => buffer[i] === byte);

// docx/xlsx/zip são, por dentro, arquivos ZIP — mesma assinatura.
const isZip: SignatureCheck = (buffer) =>
  startsWith([0x50, 0x4b, 0x03, 0x04])(buffer) ||
  startsWith([0x50, 0x4b, 0x05, 0x06])(buffer) ||
  startsWith([0x50, 0x4b, 0x07, 0x08])(buffer);

// doc/xls (formato binário antigo do Office) usam o container OLE2/CFB.
const isOle2: SignatureCheck = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const isWebp: SignatureCheck = (buffer) =>
  buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";

/**
 * Assinaturas binárias (magic bytes) por Content-Type declarado no upload —
 * o multer só valida o mimetype que o navegador informa, que é trivial de
 * falsificar (basta renomear um .exe pra "nota.pdf"). Tipos sem assinatura
 * binária confiável (texto puro) ficam fora do mapa e não são verificados.
 */
const SIGNATURE_CHECKS: Record<string, SignatureCheck> = {
  "application/pdf": startsWith([0x25, 0x50, 0x44, 0x46]), // %PDF
  "image/png": startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/jpeg": startsWith([0xff, 0xd8, 0xff]),
  "image/gif": startsWith([0x47, 0x49, 0x46, 0x38]), // GIF8
  "image/webp": isWebp,
  "application/msword": isOle2,
  "application/vnd.ms-excel": isOle2,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": isZip,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": isZip,
  "application/zip": isZip,
  "application/x-zip-compressed": isZip,
};

/**
 * Confere os magic bytes já em memória (ex.: buffer do multer.memoryStorage,
 * antes de qualquer escrita em disco) contra o Content-Type declarado. Mesma
 * semântica de verifyFileSignature — retorna true quando não há assinatura
 * conhecida para o tipo.
 */
export function verifyFileSignatureBuffer(buffer: Buffer, declaredMimeType: string): boolean {
  const check = SIGNATURE_CHECKS[declaredMimeType];
  if (!check) return true;
  return check(buffer);
}

/**
 * Confere os magic bytes do arquivo já salvo em disco contra o Content-Type
 * declarado. Retorna true quando não há assinatura conhecida para o tipo
 * (ex.: text/csv, text/plain) — nesse caso não dá pra verificar o conteúdo,
 * então não bloqueia.
 */
export async function verifyFileSignature(filePath: string, declaredMimeType: string): Promise<boolean> {
  const check = SIGNATURE_CHECKS[declaredMimeType];
  if (!check) return true;

  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    return check(buffer);
  } finally {
    await handle.close();
  }
}
