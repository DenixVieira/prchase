import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { devicesService } from "@/services/devices.service";
import { useRedirectOnQueryError } from "@/hooks/useRedirectOnQueryError";
import { HeaderCard } from "./HeaderCard";
import { DetailsCard } from "./DetailsCard";
import { AttachmentsCard } from "./AttachmentsCard";
import { MaintenanceCard } from "./MaintenanceCard";
import { PreviewDialog } from "./PreviewDialog";
import { useAttachmentPreview } from "./useAttachmentPreview";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: device, isLoading, isError, error } = useQuery({
    queryKey: ["devices", id],
    queryFn: () => devicesService.findOne(id!),
    enabled: !!id,
  });
  useRedirectOnQueryError(isError, error, "/devices");

  const { preview, handlePreview, closePreview } = useAttachmentPreview(id!);

  if (isLoading || !device) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 max-w-6xl">
      <div className="lg:col-span-2 space-y-4">
        <Breadcrumb items={[{ label: "Equipamentos", to: "/devices" }, { label: device.name || device.serialNumber }]} />
        <HeaderCard device={device} />
        <MaintenanceCard device={device} />
      </div>

      <div className="space-y-4">
        <DetailsCard device={device} />
        <AttachmentsCard device={device} onPreview={handlePreview} />
      </div>

      <PreviewDialog deviceId={id!} preview={preview} onClose={closePreview} />
    </div>
  );
}
