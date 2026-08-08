import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Ticket, Attachment, Device } from "../database/entities";
import { ApiError } from "../utils/ApiError";
import { sanitizeFileNameSegment, buildInvoiceBaseFileName } from "../utils/invoiceFile";

// Anexos existem somente em Tickets — solicitações de compra não têm upload de arquivos.
export interface UploadContext {
  year: string;
  month: string;
  protocol: string;
  ticketId?: string;
}

/**
 * Contexto de diretório/nome para o anexo de nota fiscal: usa a data do envio
 * (não a de criação do ticket) porque é o que a tela de exportação por
 * organização/período filtra, e um diretório próprio por organização
 * (<organização>/ano/mês/dia), fora da estrutura padrão de anexos (ver
 * resolveTicketUploadContext acima). "Notaanexada" nomeia o arquivo em si
 * (baseFileName = categoria + valor), não um subdiretório.
 */
export interface InvoiceUploadContext {
  organizationName: string;
  year: string;
  month: string;
  day: string;
  baseFileName: string;
  ticketId: string;
}

/**
 * Contexto de diretório para anexos de equipamento: Equipamentos/<organização>/
 * <departamento>/<número de série>/ — reflete a alocação atual do
 * equipamento no momento do upload (não muda retroativamente se o
 * equipamento for reatribuído depois).
 */
export interface DeviceUploadContext {
  organizationName: string;
  departmentName: string;
  serialNumber: string;
  deviceId: string;
}

declare global {
  namespace Express {
    interface Request {
      uploadContext?: UploadContext;
      invoiceUploadContext?: InvoiceUploadContext;
      deviceUploadContext?: DeviceUploadContext;
    }
  }
}

export async function resolveTicketUploadContext(req: Request, _res: Response, next: NextFunction) {
  try {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const ticket = await ticketRepo.findOne({ where: { id: req.params.ticketId } });
    if (!ticket) throw ApiError.notFound("Ticket não encontrado");
    if (ticket.isArchived) throw ApiError.badRequest("Ticket arquivado não pode ser alterado — desarquive antes de continuar");
    const date = new Date(ticket.createdAt);
    req.uploadContext = {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, "0"),
      protocol: ticket.protocol,
      ticketId: ticket.id,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function resolveTicketInvoiceUploadContext(req: Request, _res: Response, next: NextFunction) {
  try {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const ticket = await ticketRepo.findOne({ where: { id: req.params.ticketId }, relations: ["purchaseRequest"] });
    if (!ticket) throw ApiError.notFound("Ticket não encontrado");
    if (ticket.isArchived) throw ApiError.badRequest("Ticket arquivado não pode ser alterado — desarquive antes de continuar");
    // Nota fiscal é exclusiva de tickets nascidos de Solicitação de Compra —
    // tickets de outros tipos de solicitação não têm esse campo.
    if (!ticket.purchaseRequestId || !ticket.purchaseRequest) {
      throw ApiError.badRequest("Anexo de nota fiscal disponível apenas em tickets de Solicitação de Compra");
    }
    if (!ticket.organization) {
      throw ApiError.badRequest("Este ticket não possui organização definida — não é possível anexar nota fiscal");
    }

    // A nota fiscal é imutável: uma vez anexada, não há como substituí-la ou
    // excluí-la pela interface — barra aqui antes mesmo de processar o upload.
    const existing = await AppDataSource.getRepository(Attachment).findOne({
      where: { ticketId: ticket.id, isInvoiceNote: true },
    });
    if (existing) {
      throw ApiError.conflict("Este ticket já possui uma nota fiscal anexada e ela não pode ser substituída");
    }

    const now = new Date();
    req.invoiceUploadContext = {
      organizationName: sanitizeFileNameSegment(ticket.organization.name),
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, "0"),
      day: String(now.getDate()).padStart(2, "0"),
      // Sufixo com o protocolo do ticket no fim do arquivo salvo, ex.:
      // "Computador - R$ 1.500,00 - TCK-00042".
      baseFileName: `${buildInvoiceBaseFileName(ticket.purchaseRequest.category, ticket.purchaseRequest.estimatedValue)} - ${sanitizeFileNameSegment(ticket.protocol)}`,
      ticketId: ticket.id,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function resolveDeviceUploadContext(req: Request, _res: Response, next: NextFunction) {
  try {
    const deviceRepo = AppDataSource.getRepository(Device);
    const device = await deviceRepo.findOne({ where: { id: req.params.deviceId }, relations: ["organization", "department"] });
    if (!device) throw ApiError.notFound("Equipamento não encontrado");
    req.deviceUploadContext = {
      organizationName: sanitizeFileNameSegment(device.organization.name),
      departmentName: sanitizeFileNameSegment(device.department.name),
      serialNumber: sanitizeFileNameSegment(device.serialNumber),
      deviceId: device.id,
    };
    next();
  } catch (error) {
    next(error);
  }
}

