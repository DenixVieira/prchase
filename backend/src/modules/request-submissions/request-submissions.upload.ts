import multer from "multer";
import { env } from "../../config/env";
import { fileFilter } from "../../middlewares/upload";

/**
 * Upload em memória (não em disco) — ao contrário dos demais uploads do
 * sistema, aqui o Ticket (e o protocolo que define a pasta final do arquivo,
 * ver middlewares/upload.ts) ainda não existe no momento em que o multipart
 * chega: ele nasce na mesma requisição, dentro da transação do service. Só
 * depois que a transação confirma o protocolo é que o buffer retido aqui é
 * gravado em disco (ver RequestSubmissionsService.create) — evita arquivo
 * órfão em disco caso a criação do ticket falhe, e evita path/nome de
 * arquivo apontando pra um protocolo que nunca chegou a existir de verdade.
 */
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  // `files` limita quantas partes de arquivo o multer aceita nesta
  // requisição — como o formulário é dinâmico, não dá pra usar `.fields()`
  // com uma lista fixa de campos (por isso o `.any()` na rota), então sem
  // esse teto um multipart malicioso com dezenas de partes de arquivo seria
  // todo bufferizado em memória (fileSize x quantidade) antes do service
  // sequer olhar pra ele. 20 é bem acima de qualquer formulário real.
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024, files: 20 },
  fileFilter,
});
