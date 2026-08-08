import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { dashboardService, DashboardFilters } from "./dashboard.service";

function parseFilters(req: Request): DashboardFilters {
  const { organizationId, startDate, endDate } = req.query;
  return {
    organizationId: typeof organizationId === "string" ? organizationId : undefined,
    startDate: typeof startDate === "string" ? startDate : undefined,
    endDate: typeof endDate === "string" ? endDate : undefined,
  };
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const [cards, values, requestsByDepartment, purchasesByMonth, recentMovements, recentNotifications] =
    await Promise.all([
      dashboardService.getCards(req.user!, filters),
      dashboardService.valueSummary(req.user!, filters),
      dashboardService.requestsByDepartment(req.user!, filters),
      dashboardService.purchasesByMonth(req.user!, filters),
      dashboardService.recentMovements(req.user!, 20),
      dashboardService.recentNotifications(req.user!.id, 20),
    ]);

  sendSuccess(res, {
    cards,
    values,
    charts: { requestsByDepartment, purchasesByMonth },
    recentMovements,
    recentNotifications,
  });
});
