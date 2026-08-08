import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { Device, DeviceMaintenance, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { AuthenticatedUser } from "../../middlewares/types";
import { assertOrganizationAccess, getAccessibleOrganizationIds } from "../../utils/organizationAccess";
import { auditService } from "../audit/audit.service";
import { CreateDeviceDto, UpdateDeviceDto, CreateMaintenanceDto } from "./devices.dto";

export class DevicesService {
  private repo = AppDataSource.getRepository(Device);
  private maintenanceRepo = AppDataSource.getRepository(DeviceMaintenance);

  async list(user: AuthenticatedUser, req: Request) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "createdAt", [
      "name", "serialNumber", "model", "brand", "purchaseDate", "warrantyExpiration", "createdAt",
    ]);
    const qb = this.repo.createQueryBuilder("d")
      .leftJoinAndSelect("d.organization", "organization")
      .leftJoinAndSelect("d.department", "department");

    const accessibleOrganizationIds = getAccessibleOrganizationIds(user);
    if (accessibleOrganizationIds !== null) {
      if (accessibleOrganizationIds.length === 0) qb.andWhere("1 = 0");
      else qb.andWhere("d.organizationId IN (:...accessibleOrganizationIds)", { accessibleOrganizationIds });
    }

    if (req.query.organizationId) qb.andWhere("d.organizationId = :organizationId", { organizationId: req.query.organizationId });
    if (req.query.departmentId) qb.andWhere("d.departmentId = :departmentId", { departmentId: req.query.departmentId });
    if (search) {
      qb.andWhere("(d.name ILIKE :search OR d.mac ILIKE :search OR d.serialNumber ILIKE :search)", { search: `%${search}%` });
    }

    qb.orderBy(`d.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findByIdOrFail(id: string, user?: AuthenticatedUser): Promise<Device> {
    const device = await this.repo.findOne({
      where: { id },
      relations: ["organization", "department", "attachments", "attachments.uploadedBy", "maintenances", "maintenances.registeredBy"],
    });
    if (!device) throw ApiError.notFound("Equipamento não encontrado");
    if (user) assertOrganizationAccess(user, device.organizationId);
    device.attachments?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    device.maintenances?.sort((a, b) => b.sentDate.localeCompare(a.sentDate));
    return device;
  }

  async create(user: AuthenticatedUser, dto: CreateDeviceDto, req: Request): Promise<Device> {
    assertOrganizationAccess(user, dto.organizationId);
    const device = await this.repo.save(this.repo.create(dto));
    await auditService.log({ userId: user.id, action: AuditAction.CREATE, entity: "Device", entityId: device.id, req });
    return this.findByIdOrFail(device.id, user);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDeviceDto, req: Request): Promise<Device> {
    const device = await this.findByIdOrFail(id, user);
    if (dto.organizationId) assertOrganizationAccess(user, dto.organizationId);
    Object.assign(device, dto);
    await this.repo.save(device);
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Device", entityId: id, req });
    return this.findByIdOrFail(id, user);
  }

  async remove(user: AuthenticatedUser, id: string, req: Request): Promise<void> {
    const device = await this.findByIdOrFail(id, user);
    await this.repo.softDelete(device.id);
    await auditService.log({ userId: user.id, action: AuditAction.DELETE, entity: "Device", entityId: id, req });
  }

  async addMaintenance(user: AuthenticatedUser, id: string, dto: CreateMaintenanceDto, req: Request): Promise<Device> {
    const device = await this.findByIdOrFail(id, user);
    await this.maintenanceRepo.save(
      this.maintenanceRepo.create({
        deviceId: device.id,
        sentDate: dto.sentDate,
        returnDate: dto.returnDate ?? null,
        reason: dto.reason,
        registeredById: user.id,
      })
    );
    await auditService.log({ userId: user.id, action: AuditAction.CREATE, entity: "DeviceMaintenance", entityId: device.id, req });
    return this.findByIdOrFail(id, user);
  }
}

export const devicesService = new DevicesService();
