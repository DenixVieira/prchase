import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { requestSubmissionsService } from "./request-submissions.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const requestTypeId = req.body.requestTypeId as string | undefined;
  if (!requestTypeId) throw ApiError.badRequest("Informe o tipo de solicitação");
  const organizationId = req.body.organizationId as string | undefined;
  if (!organizationId) throw ApiError.badRequest("Informe a organização");

  // Valores dos campos não-arquivo chegam como um único campo de texto
  // "data" contendo JSON (os campos FILE vêm à parte, em req.files) — assim
  // preservamos tipos (number, boolean, array) sem precisar reconstruir um
  // objeto a partir de chaves multipart achatadas.
  let data: Record<string, unknown> = {};
  if (req.body.data) {
    try {
      data = JSON.parse(req.body.data);
    } catch {
      throw ApiError.badRequest("Campo 'data' inválido — esperado JSON");
    }
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const ticket = await requestSubmissionsService.create(req.user!, requestTypeId, organizationId, data, files, req);
  sendSuccess(res, ticket, 201);
});
