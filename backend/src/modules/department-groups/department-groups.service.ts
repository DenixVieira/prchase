import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { DepartmentGroup, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";
import { CreateDepartmentGroupDto, UpdateDepartmentGroupDto } from "./department-groups.dto";

export class DepartmentGroupsService {
  private repo = AppDataSource.getRepository(DepartmentGroup);

  async list(): Promise<DepartmentGroup[]> {
    return this.repo.find({ relations: ["organization"], order: { name: "ASC" } });
  }

  async findByIdOrFail(id: string): Promise<DepartmentGroup> {
    const group = await this.repo.findOne({ where: { id }, relations: ["organization"] });
    if (!group) throw ApiError.notFound("Grupo de departamentos não encontrado");
    return group;
  }

  async create(actorId: string, dto: CreateDepartmentGroupDto, req: Request): Promise<DepartmentGroup> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw ApiError.conflict("Já existe um grupo com este nome");

    const group = await this.repo.save(this.repo.create(dto));
    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "DepartmentGroup", entityId: group.id, req });
    return this.findByIdOrFail(group.id);
  }

  async update(actorId: string, id: string, dto: UpdateDepartmentGroupDto, req: Request): Promise<DepartmentGroup> {
    const group = await this.findByIdOrFail(id);
    if (dto.name && dto.name !== group.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw ApiError.conflict("Já existe um grupo com este nome");
    }
    Object.assign(group, dto);
    await this.repo.save(group);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "DepartmentGroup", entityId: id, req });
    return this.findByIdOrFail(id);
  }

  // Sem soft delete: catálogo simples. Departamentos vinculados ficam sem
  // grupo (FK com ON DELETE SET NULL), não são removidos junto.
  async remove(actorId: string, id: string, req: Request): Promise<void> {
    await this.findByIdOrFail(id);
    await this.repo.delete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "DepartmentGroup", entityId: id, req });
  }
}

export const departmentGroupsService = new DepartmentGroupsService();
