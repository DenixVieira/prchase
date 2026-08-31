import { Request } from "express";
import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Board, BoardColumn, Ticket, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";
import { BoardColumnDto } from "./boards.dto";

const DEFAULT_COLUMNS: Omit<Partial<BoardColumn>, "boardId">[] = [
  { name: "Pendente", color: "#94a3b8", order: 0, isInitial: true, isDone: false, isCancelled: false },
  { name: "Em andamento", color: "#fbbf24", order: 1, isInitial: false, isDone: false, isCancelled: false },
  { name: "Resolvido", color: "#34d399", order: 2, isInitial: false, isDone: true, isCancelled: false },
  { name: "Cancelado", color: "#f87171", order: 3, isInitial: false, isDone: false, isCancelled: true },
];

export class BoardsService {
  private boardRepo = AppDataSource.getRepository(Board);
  private columnRepo = AppDataSource.getRepository(BoardColumn);
  private ticketRepo = AppDataSource.getRepository(Ticket);

  /**
   * Cria o board de um departamento com as 4 colunas padrão (mesmas de
   * sempre, antes de existir configuração) — chamado toda vez que um
   * departamento nasce, seja pela UI (departments.service.ts::create()) seja
   * pelo seed (run-seed.ts, que cria departamento direto no repositório, sem
   * passar pelo service). `manager` opcional permite rodar dentro de uma
   * transação já aberta pelo chamador.
   */
  async provisionBoard(department: { id: string; name: string }, manager?: EntityManager): Promise<Board> {
    const boardRepo = manager ? manager.getRepository(Board) : this.boardRepo;
    const columnRepo = manager ? manager.getRepository(BoardColumn) : this.columnRepo;

    const board = await boardRepo.save(boardRepo.create({ departmentId: department.id, name: department.name }));
    await columnRepo.save(DEFAULT_COLUMNS.map((c) => columnRepo.create({ ...c, boardId: board.id })));
    return board;
  }

  async getByIdOrFail(id: string): Promise<Board> {
    const board = await this.boardRepo.findOne({ where: { id }, relations: ["columns"] });
    if (!board) throw ApiError.notFound("Board não encontrado");
    board.columns?.sort((a, b) => a.order - b.order);
    return board;
  }

  async getByDepartmentId(departmentId: string): Promise<Board> {
    const board = await this.boardRepo.findOne({ where: { departmentId }, relations: ["columns"] });
    if (!board) throw ApiError.notFound("Este departamento ainda não tem um board configurado");
    board.columns?.sort((a, b) => a.order - b.order);
    return board;
  }

  /** Coluna onde todo ticket novo nasce, pro departamento informado — usado ao aprovar Compra e ao criar solicitação dinâmica. */
  async getInitialColumn(departmentId: string): Promise<BoardColumn> {
    const board = await this.getByDepartmentId(departmentId);
    const initial = board.columns.find((c) => c.isInitial);
    if (!initial) throw ApiError.internal(`Board do departamento ${departmentId} não tem coluna inicial definida`);
    return initial;
  }

  /**
   * Substitui a lista de colunas do board. Colunas existentes cujo `id` foi
   * reenviado são atualizadas no lugar (mantém o id — tickets continuam
   * apontando pra elas); as que sumiram da lista são removidas, MAS só se
   * não tiverem ticket algum (senão a constraint de FK já rejeitaria a
   * remoção lá no banco de qualquer forma — aqui só damos uma mensagem
   * legível em vez do erro cru do Postgres).
   */
  async replaceColumns(actorId: string, boardId: string, input: BoardColumnDto[], req: Request): Promise<Board> {
    const board = await this.getByIdOrFail(boardId);

    const initialCount = input.filter((c) => c.isInitial).length;
    if (initialCount !== 1) {
      throw ApiError.badRequest("Marque exatamente uma coluna como inicial");
    }

    const existingIds = new Set(board.columns.map((c) => c.id));
    for (const c of input) {
      if (c.id && !existingIds.has(c.id)) {
        throw ApiError.badRequest("Uma das colunas informadas não pertence a este board");
      }
    }

    const keptIds = new Set(input.filter((c) => c.id).map((c) => c.id!));
    const removedIds = [...existingIds].filter((id) => !keptIds.has(id));

    if (removedIds.length > 0) {
      const ticketsInRemovedColumns = await this.ticketRepo.count({ where: { columnId: In(removedIds) } });
      if (ticketsInRemovedColumns > 0) {
        throw ApiError.conflict("Não é possível remover uma coluna que ainda tem ticket — mova os tickets pra outra coluna antes");
      }
    }

    await AppDataSource.transaction(async (manager) => {
      if (removedIds.length > 0) {
        await manager.delete(BoardColumn, removedIds);
      }
      for (const [index, c] of input.entries()) {
        const values = {
          name: c.name,
          color: c.color ?? "#94a3b8",
          order: index,
          isInitial: !!c.isInitial,
          isDone: !!c.isDone,
          isCancelled: !!c.isCancelled,
        };
        if (c.id) {
          await manager.update(BoardColumn, c.id, values);
        } else {
          await manager.save(manager.create(BoardColumn, { ...values, boardId }));
        }
      }
    });

    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "Board", entityId: boardId, req, metadata: { columnsCount: input.length } });
    return this.getByIdOrFail(boardId);
  }
}

export const boardsService = new BoardsService();
