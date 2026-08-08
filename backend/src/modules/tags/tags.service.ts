import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { Tag, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";

export class TagsService {
  private repo = AppDataSource.getRepository(Tag);

  async list(): Promise<Tag[]> {
    return this.repo.find({ order: { name: "ASC" } });
  }

  async findByIdOrFail(id: string): Promise<Tag> {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw ApiError.notFound("Etiqueta não encontrada");
    return tag;
  }

  async create(actorId: string, dto: { name: string; color?: string }, req: Request): Promise<Tag> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw ApiError.conflict("Já existe uma etiqueta com este nome");

    const tag = await this.repo.save(this.repo.create(dto));
    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "Tag", entityId: tag.id, req });
    return tag;
  }

  async update(actorId: string, id: string, dto: { name?: string; color?: string }, req: Request): Promise<Tag> {
    const tag = await this.findByIdOrFail(id);
    if (dto.name && dto.name !== tag.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw ApiError.conflict("Já existe uma etiqueta com este nome");
    }
    Object.assign(tag, dto);
    await this.repo.save(tag);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "Tag", entityId: id, req });
    return tag;
  }

  // Sem soft delete: etiqueta é catálogo simples, não um registro de negócio
  // com histórico próprio. A remoção do vínculo em ticket_tags acontece em
  // cascata (FK gerada pelo TypeORM para relações M:N usa ON DELETE CASCADE).
  async remove(actorId: string, id: string, req: Request): Promise<void> {
    await this.findByIdOrFail(id);
    await this.repo.delete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "Tag", entityId: id, req });
  }
}

export const tagsService = new TagsService();
