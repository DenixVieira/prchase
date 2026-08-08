import { AppDataSource } from "../../config/data-source";
import { History, HistoryAction } from "../../database/entities";

export class HistoryService {
  private repo = AppDataSource.getRepository(History);

  async record(params: {
    ticketId?: string | null;
    purchaseRequestId?: string | null;
    userId: string;
    action: HistoryAction;
    description: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<History> {
    return this.repo.save(
      this.repo.create({
        ticketId: params.ticketId ?? null,
        purchaseRequestId: params.purchaseRequestId ?? null,
        userId: params.userId,
        action: params.action,
        description: params.description,
        metadata: params.metadata ?? null,
      })
    );
  }

  async listByTicket(ticketId: string): Promise<History[]> {
    return this.repo.find({ where: { ticketId }, order: { createdAt: "ASC" } });
  }

  async listByPurchaseRequest(purchaseRequestId: string): Promise<History[]> {
    return this.repo.find({ where: { purchaseRequestId }, order: { createdAt: "ASC" } });
  }
}

export const historyService = new HistoryService();
