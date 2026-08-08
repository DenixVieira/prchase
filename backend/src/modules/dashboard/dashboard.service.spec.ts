import { AuthenticatedUser } from "../../middlewares/types";

function createQueryBuilderMock() {
  const qb: Record<string, jest.Mock> = {
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
}

const purchaseRequestRepoMock = { createQueryBuilder: jest.fn() };
const ticketRepoMock = { createQueryBuilder: jest.fn() };
const historyRepoMock = { find: jest.fn() };
const notificationRepoMock = { find: jest.fn() };

jest.mock("../../config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: { name: string }) => {
      if (entity.name === "PurchaseRequest") return purchaseRequestRepoMock;
      if (entity.name === "Ticket") return ticketRepoMock;
      if (entity.name === "History") return historyRepoMock;
      if (entity.name === "Notification") return notificationRepoMock;
      return {};
    }),
  },
}));

import { DashboardService } from "./dashboard.service";

function makeUser(overrides: { organizationAccess?: { hasFullAccess: boolean; allowedOrganizationIds: string[] } } = {}): AuthenticatedUser {
  return {
    id: "user-1",
    login: "user1",
    email: "user1@empresa.com",
    name: "User One",
    departmentId: "dept-1",
    isAdmin: false,
    organizationAccess: { homeOrganizationId: null, hasFullAccess: true, allowedOrganizationIds: [], ...overrides.organizationAccess },
  };
}

describe("DashboardService filters", () => {
  let service: DashboardService;
  let prQb: ReturnType<typeof createQueryBuilderMock>;
  let tQb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
    prQb = createQueryBuilderMock();
    tQb = createQueryBuilderMock();
    purchaseRequestRepoMock.createQueryBuilder.mockImplementation(() => createQueryBuilderMock());
    ticketRepoMock.createQueryBuilder.mockImplementation(() => createQueryBuilderMock());
  });

  it("não restringe por organização quando o usuário tem acesso total", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser({ organizationAccess: { hasFullAccess: true, allowedOrganizationIds: [] } });

    await service.requestsByDepartment(user);

    const organizationClauses = prQb.andWhere.mock.calls.filter(([clause]) => String(clause).includes("organizationId"));
    expect(organizationClauses).toHaveLength(0);
  });

  it("restringe às organizações acessíveis quando o usuário não tem acesso total", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser({ organizationAccess: { hasFullAccess: false, allowedOrganizationIds: ["org-1", "org-2"] } });

    await service.requestsByDepartment(user);

    expect(prQb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("pr.organizationId IN"),
      { accessibleOrganizationIds: ["org-1", "org-2"] }
    );
  });

  it("bloqueia tudo (1 = 0) quando o departamento não tem nenhuma organização acessível", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser({ organizationAccess: { hasFullAccess: false, allowedOrganizationIds: [] } });

    await service.requestsByDepartment(user);

    expect(prQb.andWhere).toHaveBeenCalledWith("1 = 0");
  });

  it("aplica o filtro exato de organização quando informado e o usuário tem acesso a ela", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser({ organizationAccess: { hasFullAccess: false, allowedOrganizationIds: ["org-1"] } });

    await service.requestsByDepartment(user, { organizationId: "org-1" });

    expect(prQb.andWhere).toHaveBeenCalledWith("pr.organizationId = :filterOrganizationId", { filterOrganizationId: "org-1" });
  });

  it("rejeita o filtro de organização quando o usuário não tem acesso a ela", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser({ organizationAccess: { hasFullAccess: false, allowedOrganizationIds: ["org-1"] } });

    await expect(service.requestsByDepartment(user, { organizationId: "org-999" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("aplica o intervalo de datas informado sobre a coluna de criação", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
    const user = makeUser();

    await service.requestsByDepartment(user, { startDate: "2026-01-01", endDate: "2026-01-31" });

    expect(prQb.andWhere).toHaveBeenCalledWith("pr.createdAt >= :startDate", { startDate: "2026-01-01" });
    expect(prQb.andWhere).toHaveBeenCalledWith("pr.createdAt <= :endDate", { endDate: "2026-01-31 23:59:59.999" });
  });

  it("getCards consulta tanto solicitações quanto tickets com os mesmos filtros", async () => {
    purchaseRequestRepoMock.createQueryBuilder.mockImplementation(() => createQueryBuilderMock());
    ticketRepoMock.createQueryBuilder.mockImplementation(() => createQueryBuilderMock());
    const user = makeUser();

    const cards = await service.getCards(user, { organizationId: undefined });

    expect(cards).toEqual({
      pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0,
      pendingTickets: 0, inProgressTickets: 0, resolvedTickets: 0, cancelledTickets: 0,
    });
    expect(purchaseRequestRepoMock.createQueryBuilder).toHaveBeenCalledWith("pr");
    expect(ticketRepoMock.createQueryBuilder).toHaveBeenCalledWith("t");
  });

  describe("purchasesByMonth", () => {
    it("usa a janela padrão de 12 meses quando nenhuma data é informada", async () => {
      purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
      const user = makeUser();

      await service.purchasesByMonth(user);

      expect(prQb.andWhere).toHaveBeenCalledWith("pr.approvedAt >= NOW() - INTERVAL '12 months'");
    });

    it("não aplica a janela padrão quando um intervalo de datas é informado", async () => {
      purchaseRequestRepoMock.createQueryBuilder.mockReturnValue(prQb);
      const user = makeUser();

      await service.purchasesByMonth(user, { startDate: "2026-01-01" });

      const defaultWindowCalls = prQb.andWhere.mock.calls.filter(
        ([clause]) => clause === "pr.approvedAt >= NOW() - INTERVAL '12 months'"
      );
      expect(defaultWindowCalls).toHaveLength(0);
      expect(prQb.andWhere).toHaveBeenCalledWith("pr.approvedAt >= :startDate", { startDate: "2026-01-01" });
    });
  });
});
