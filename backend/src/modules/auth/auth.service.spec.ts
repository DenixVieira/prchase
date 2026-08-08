import bcrypt from "bcrypt";
import { Request } from "express";

const userRepoMock = {
  createQueryBuilder: jest.fn(),
  save: jest.fn(),
};
const refreshTokenRepoMock = {
  update: jest.fn(),
};

jest.mock("../../config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: { name: string }) => {
      if (entity.name === "User") return userRepoMock;
      if (entity.name === "RefreshToken") return refreshTokenRepoMock;
      return {};
    }),
  },
}));

jest.mock("bcrypt");

jest.mock("../audit/audit.service", () => ({
  auditService: { log: jest.fn() },
}));

import { AuthService } from "./auth.service";

describe("AuthService.changeEmail", () => {
  let service: AuthService;
  let qbMock: { addSelect: jest.Mock; where: jest.Mock; getOne: jest.Mock };
  const req = {} as Request;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
    qbMock = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    userRepoMock.createQueryBuilder.mockReturnValue(qbMock);
  });

  const baseUser = () => ({ id: "user-1", email: "old@empresa.com", passwordHash: "hashed" });

  it("rejeita quando a senha atual está incorreta", async () => {
    qbMock.getOne.mockResolvedValueOnce(baseUser());
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(service.changeEmail("user-1", "wrong", "new@empresa.com", req)).rejects.toMatchObject({
      statusCode: 400,
      message: "Senha atual incorreta",
    });
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  it("rejeita quando o novo e-mail é igual ao atual (case-insensitive)", async () => {
    qbMock.getOne.mockResolvedValueOnce(baseUser());
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    await expect(service.changeEmail("user-1", "correct", "OLD@EMPRESA.com", req)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  it("rejeita com conflito quando o e-mail já está em uso por outro usuário", async () => {
    qbMock.getOne
      .mockResolvedValueOnce(baseUser()) // busca do usuário autenticado
      .mockResolvedValueOnce({ id: "other-user" }); // verificação de e-mail já existente
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    await expect(service.changeEmail("user-1", "correct", "new@empresa.com", req)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  it("atualiza o e-mail quando os dados são válidos", async () => {
    const user = baseUser();
    qbMock.getOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    userRepoMock.save.mockResolvedValueOnce(user);

    const result = await service.changeEmail("user-1", "correct", "new@empresa.com", req);

    expect(user.email).toBe("new@empresa.com");
    expect(userRepoMock.save).toHaveBeenCalledWith(user);
    expect(result.email).toBe("new@empresa.com");
  });
});
