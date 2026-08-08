import { FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportTabProps {
  filtersReady: boolean;
  isDownloading: boolean;
  onDownload: () => void;
}

export function ExportTab({ filtersReady, isDownloading, onDownload }: ExportTabProps) {
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        Baixa um arquivo ZIP com o diretório da organização e todas as notas fiscais anexadas no
        período escolhido acima.
      </p>
      <Button className="w-full" disabled={!filtersReady || isDownloading} isLoading={isDownloading} onClick={onDownload}>
        {!isDownloading && <FileArchive className="h-4 w-4" />}
        Baixar ZIP
      </Button>
    </>
  );
}
