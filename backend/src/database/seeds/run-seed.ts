import "reflect-metadata";
import bcrypt from "bcrypt";
import { FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { logger } from "../../config/logger";
import {
  User, Department, Permission, DepartmentPermission, Setting, PermissionKey,
  NotificationPreference, Organization, RequestType, RequestTypeSourceKind,
} from "../entities";
import { env } from "../../config/env";
import { boardsService } from "../../modules/boards/boards.service";

/**
 * Busca por nome incluindo soft-deleted (`withDeleted`) e reativa
 * (`deletedAt = null`) quando encontra — sem isso, um registro que já foi
 * excluído pela UI em algum momento faz o seed tentar recriá-lo do zero e
 * quebrar na constraint de unicidade do nome (`findOne` comum já filtra
 * soft-deleted por padrão, então nunca "acha" o existente).
 */
async function findOrRestore<T extends ObjectLiteral & { deletedAt?: Date | null }>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>
): Promise<T | null> {
  const existing = await repo.findOne({ where, withDeleted: true });
  if (existing && existing.deletedAt) {
    existing.deletedAt = null;
    return repo.save(existing);
  }
  return existing;
}

const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  [PermissionKey.CREATE_PURCHASE_REQUEST]: "Criar Solicitação de Compra",
  [PermissionKey.EDIT_PURCHASE_REQUEST]: "Editar Solicitação de Compra",
  [PermissionKey.CANCEL_PURCHASE_REQUEST]: "Cancelar Solicitação de Compra",
  [PermissionKey.VIEW_PURCHASE_REQUEST]: "Visualizar Solicitação de Compra",
  [PermissionKey.APPROVE_PURCHASE_REQUEST]: "Aprovar Solicitação de Compra",
  [PermissionKey.MOVE_TICKET]: "Alterações em Ticket",
  [PermissionKey.RESOLVE_TICKET]: "Resolver Ticket",
  [PermissionKey.CANCEL_TICKET]: "Cancelar Ticket",
  [PermissionKey.DELETE_TICKET]: "Excluir Ticket",
  [PermissionKey.COMMENT_TICKET]: "Comentar Ticket",
  [PermissionKey.ATTACH_FILES]: "Anexar Arquivos",
  [PermissionKey.VIEW_TICKET]: "Visualizar Ticket",
  [PermissionKey.VIEW_ARCHIVED_TICKETS]: "Visualizar Tickets Arquivados",
  [PermissionKey.EXPORT_INVOICES]: "Exportar Notas Fiscais",
  [PermissionKey.CREATE_TAG]: "Criar Etiquetas",
  [PermissionKey.VIEW_DEVICE]: "Visualizar Equipamentos",
  [PermissionKey.CREATE_DEVICE]: "Cadastrar Equipamentos",
  [PermissionKey.EDIT_DEVICE]: "Editar Equipamentos",
  [PermissionKey.DELETE_DEVICE]: "Excluir Equipamentos",
  [PermissionKey.REGISTER_DEVICE_MAINTENANCE]: "Registrar Manutenção de Equipamentos",
  [PermissionKey.MANAGE_USERS]: "Gerenciar Usuários",
  [PermissionKey.MANAGE_DEPARTMENTS]: "Gerenciar Departamentos",
  [PermissionKey.MANAGE_SETTINGS]: "Gerenciar Configurações",
  [PermissionKey.SYSTEM_ADMIN]: "Administrador do Sistema",
  [PermissionKey.MANAGE_REQUEST_TYPES]: "Gerenciar Tipos de Solicitação",
  [PermissionKey.CREATE_REQUEST]: "Criar Solicitação",
  [PermissionKey.VIEW_DASHBOARD]: "Visualizar Dashboard",
};

async function seed() {
  await AppDataSource.initialize();
  logger.info("Iniciando seed do banco de dados...");

  const permissionRepo = AppDataSource.getRepository(Permission);
  const departmentRepo = AppDataSource.getRepository(Department);
  const deptPermRepo = AppDataSource.getRepository(DepartmentPermission);
  const userRepo = AppDataSource.getRepository(User);
  const settingRepo = AppDataSource.getRepository(Setting);
  const organizationRepo = AppDataSource.getRepository(Organization);
  const requestTypeRepo = AppDataSource.getRepository(RequestType);

  // 1. Permissões
  const permissionsByKey = new Map<PermissionKey, Permission>();
  for (const key of Object.values(PermissionKey)) {
    let permission = await permissionRepo.findOne({ where: { key } });
    if (!permission) {
      permission = await permissionRepo.save(
        permissionRepo.create({ key, description: PERMISSION_DESCRIPTIONS[key] })
      );
    }
    permissionsByKey.set(key, permission);
  }
  logger.info(`Permissões: ${permissionsByKey.size} registradas.`);

  // 2. Departamentos
  const departmentsData = [
    { name: "Administração", description: "Departamento administrativo do sistema" },
    { name: "Tecnologia da Informação", description: "Departamento de TI, solicitante de compras" },
    { name: "Compras", description: "Departamento responsável por aprovar e executar compras" },
    { name: "Financeiro", description: "Departamento financeiro" },
  ];
  const departments = new Map<string, Department>();
  for (const data of departmentsData) {
    let department = await findOrRestore(departmentRepo, { name: data.name });
    if (!department) {
      department = await departmentRepo.save(departmentRepo.create(data));
      // Departamento genuinamente novo (não existia nem soft-deleted) — os
      // que já existiam antes desta feature já ganharam board na migration
      // 1700000000012, então só o caminho de criação de verdade precisa
      // provisionar (departments.service.ts::create() cobre a criação feita
      // pela UI; este loop não passa por lá).
      await boardsService.provisionBoard(department);
    }
    departments.set(data.name, department);
  }
  logger.info(`Departamentos: ${departments.size} registrados.`);

  // 2.1 Organizações (unidades/sites aos quais solicitações e tickets pertencem)
  const organizationsData = [
    { name: "Matriz", description: "Unidade sede da empresa" },
    { name: "Filial São Paulo", description: "Unidade filial em São Paulo" },
    { name: "Filial Rio de Janeiro", description: "Unidade filial no Rio de Janeiro" },
  ];
  const organizations = new Map<string, Organization>();
  for (const data of organizationsData) {
    let organization = await findOrRestore(organizationRepo, { name: data.name });
    if (!organization) {
      organization = await organizationRepo.save(organizationRepo.create(data));
    }
    organizations.set(data.name, organization);
  }
  logger.info(`Organizações: ${organizations.size} registradas.`);

  // 2.2 Configuração de acesso a organizações por departamento.
  // Administração e Compras enxergam/interagem com tickets e solicitações de
  // TODAS as organizações (acesso total). Os demais departamentos ficam restritos
  // à sua organização padrão (Matriz) — cenário típico de um departamento que só
  // deve interagir com o que acontece na sua própria unidade.
  const matriz = organizations.get("Matriz")!;
  const fullAccessDepartments = ["Administração", "Compras"];
  const restrictedDepartments = ["Tecnologia da Informação", "Financeiro"];
  for (const name of [...fullAccessDepartments, ...restrictedDepartments]) {
    const department = departments.get(name)!;
    department.homeOrganizationId = matriz.id;
    department.hasFullOrganizationAccess = fullAccessDepartments.includes(name);
    await departmentRepo.save(department);
  }
  logger.info("Acesso a organizações configurado por departamento.");

  // 3. Permissões por departamento
  const grantPermissions = async (departmentName: string, keys: PermissionKey[]) => {
    const department = departments.get(departmentName)!;
    for (const key of keys) {
      const permission = permissionsByKey.get(key)!;
      const exists = await deptPermRepo.findOne({
        where: { departmentId: department.id, permissionId: permission.id },
      });
      if (!exists) {
        await deptPermRepo.save(
          deptPermRepo.create({ departmentId: department.id, permissionId: permission.id, granted: true })
        );
      }
    }
  };

  await grantPermissions("Administração", Object.values(PermissionKey));

  await grantPermissions("Tecnologia da Informação", [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.CREATE_PURCHASE_REQUEST,
    PermissionKey.EDIT_PURCHASE_REQUEST,
    PermissionKey.CANCEL_PURCHASE_REQUEST,
    PermissionKey.VIEW_PURCHASE_REQUEST,
    PermissionKey.VIEW_TICKET,
    PermissionKey.VIEW_ARCHIVED_TICKETS,
    PermissionKey.EXPORT_INVOICES,
    PermissionKey.COMMENT_TICKET,
    PermissionKey.ATTACH_FILES,
    PermissionKey.VIEW_DEVICE,
    PermissionKey.CREATE_DEVICE,
    PermissionKey.EDIT_DEVICE,
    PermissionKey.REGISTER_DEVICE_MAINTENANCE,
  ]);

  await grantPermissions("Compras", [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_PURCHASE_REQUEST,
    PermissionKey.APPROVE_PURCHASE_REQUEST,
    PermissionKey.MOVE_TICKET,
    PermissionKey.RESOLVE_TICKET,
    PermissionKey.CANCEL_TICKET,
    PermissionKey.COMMENT_TICKET,
    PermissionKey.ATTACH_FILES,
    PermissionKey.VIEW_TICKET,
    PermissionKey.VIEW_ARCHIVED_TICKETS,
    PermissionKey.EXPORT_INVOICES,
    PermissionKey.CREATE_TAG,
    PermissionKey.VIEW_DEVICE,
    PermissionKey.CREATE_DEVICE,
    PermissionKey.EDIT_DEVICE,
    PermissionKey.REGISTER_DEVICE_MAINTENANCE,
  ]);

  await grantPermissions("Financeiro", [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_PURCHASE_REQUEST,
    PermissionKey.APPROVE_PURCHASE_REQUEST,
    PermissionKey.VIEW_TICKET,
    PermissionKey.VIEW_ARCHIVED_TICKETS,
    PermissionKey.EXPORT_INVOICES,
    PermissionKey.COMMENT_TICKET,
    PermissionKey.VIEW_DEVICE,
  ]);

  logger.info("Permissões vinculadas aos departamentos.");

  // 4. Usuários
  const hash = (plain: string) => bcrypt.hash(plain, 10);

  const usersData = [
    {
      name: "Administrador do Sistema",
      login: "admin",
      email: "admin@empresa.com",
      password: "Admin@123",
      departmentName: "Administração",
      isAdmin: true,
    }
  ];

  for (const data of usersData) {
    let user = await findOrRestore(userRepo, { login: data.login });
    if (!user) {
      const department = departments.get(data.departmentName)!;
      user = await userRepo.save(
        userRepo.create({
          name: data.name,
          login: data.login,
          email: data.email,
          passwordHash: await hash(data.password),
          departmentId: department.id,
          isAdmin: data.isAdmin,
          isActive: true,
          notificationPreference: NotificationPreference.BOTH,
        })
      );
    }
  }
  logger.info(`Usuários: ${usersData.length} registrados (senha padrão informada no README).`);

  // 5. Configuração SMTP padrão
  const smtpKey = "smtp";
  const existingSetting = await settingRepo.findOne({ where: { key: smtpKey } });
  if (!existingSetting) {
    await settingRepo.save(
      settingRepo.create({
        key: smtpKey,
        value: {
          host: env.smtpDefaults.host,
          port: env.smtpDefaults.port,
          secure: env.smtpDefaults.secure,
          user: env.smtpDefaults.user,
          password: env.smtpDefaults.password,
          fromEmail: env.smtpDefaults.fromEmail,
          fromName: env.smtpDefaults.fromName,
        },
      })
    );
  }
  logger.info("Configuração SMTP padrão registrada.");

  // 6. Tipo de Solicitação semente — representa a Solicitação de Compra na
  // tela "Nova Solicitação" (só como card/vitrine: nunca é usado pra
  // renderizar formulário nem gerar Ticket, a Compra continua no fluxo
  // dedicado de sempre).
  const purchaseRequestCardName = "Solicitação de Compra";
  const existingPurchaseRequestType = await findOrRestore(requestTypeRepo, { name: purchaseRequestCardName });
  if (!existingPurchaseRequestType) {
    await requestTypeRepo.save(
      requestTypeRepo.create({
        name: purchaseRequestCardName,
        description: "Solicitar a compra de um produto ou serviço",
        departmentId: null,
        icon: "ShoppingCart",
        sourceKind: RequestTypeSourceKind.PURCHASE_REQUEST,
        isBuiltIn: true,
        isActive: true,
      })
    );
  }
  logger.info("Tipo de Solicitação semente (Compra) registrado.");

  await AppDataSource.destroy();
  logger.info("Seed concluído com sucesso.");
}

seed().catch((error) => {
  logger.error({ error }, "Erro ao executar seed");
  process.exit(1);
});
