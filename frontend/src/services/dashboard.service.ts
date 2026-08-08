import { api } from "./api";

export interface DashboardFilters {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardOverview {
  cards: {
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    pendingTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    cancelledTickets: number;
  };
  values: {
    approvedValue: number;
    rejectedValue: number;
    pendingApprovalValue: number;
    draftValue: number;
    cancelledValue: number;
    totalValue: number;
  };
  charts: {
    requestsByDepartment: { department: string; total: string }[];
    purchasesByMonth: { month: string; totalValue: string }[];
  };
  recentMovements: { id: string; description: string; createdAt: string }[];
  recentNotifications: { id: string; title: string; message: string; createdAt: string }[];
}

export const dashboardService = {
  async overview(filters: DashboardFilters = {}): Promise<DashboardOverview> {
    const { data } = await api.get("/dashboard/overview", { params: filters });
    return data.data;
  },
};
