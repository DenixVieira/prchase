import { Department } from "@/types";

/** Só entram departamentos que têm a organização informada como principal
 * (homeOrganization) — usado para filtrar o seletor de departamento sempre
 * que uma organização específica está em foco (cadastro/filtro de equipamentos). */
export function isHomeOrganization(department: Department, organizationId: string): boolean {
  return department.homeOrganizationId === organizationId;
}
