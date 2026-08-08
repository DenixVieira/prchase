import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { dashboardService } from "@/services/dashboard.service";
import { organizationsService } from "@/services/organizations.service";
import { FiltersCard } from "./FiltersCard";
import { StatCards } from "./StatCards";
import { ValueCards } from "./ValueCards";
import { Charts } from "./Charts";
import { RecentActivity } from "./RecentActivity";

export default function DashboardPage() {
  const [organizationId, setOrganizationId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: organizations } = useQuery({ queryKey: ["organizations", "my-accessible"], queryFn: () => organizationsService.myAccessible() });

  const filters = useMemo(
    () => ({
      organizationId: organizationId !== "all" ? organizationId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [organizationId, startDate, endDate]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview", filters],
    queryFn: () => dashboardService.overview(filters),
  });

  const hasActiveFilters = organizationId !== "all" || !!startDate || !!endDate;
  const clearFilters = () => { setOrganizationId("all"); setStartDate(""); setEndDate(""); };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      <FiltersCard
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        organizationId={organizationId}
        onOrganizationIdChange={setOrganizationId}
        organizations={organizations}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      <StatCards data={data} isLoading={isLoading} />
      <ValueCards data={data} isLoading={isLoading} />
      <Charts data={data} isLoading={isLoading} />
      <RecentActivity data={data} isLoading={isLoading} />
    </div>
  );
}
