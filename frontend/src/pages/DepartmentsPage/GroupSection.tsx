import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Department } from "@/types";
import { DepartmentCard } from "./DepartmentCard";

interface GroupSectionProps {
  title: string;
  subtitle?: string;
  departments: Department[];
  onManagePermissions: (department: Department) => void;
  onManageOrganizations: (department: Department) => void;
}

export function GroupSection({ title, subtitle, departments, onManagePermissions, onManageOrganizations }: GroupSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")} />
        <span className="text-sm font-semibold">{title}</span>
        {subtitle && <span className="text-xs text-muted-foreground">— {subtitle}</span>}
        <span className="text-xs text-muted-foreground">({departments.length})</span>
      </button>
      {open && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onManagePermissions={() => onManagePermissions(department)}
              onManageOrganizations={() => onManageOrganizations(department)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
